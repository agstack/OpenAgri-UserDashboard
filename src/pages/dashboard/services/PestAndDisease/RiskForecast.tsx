import ParcelSelectionModule from "@components/dashboard/ParcelSelectionModule/ParcelSelectionModule";
import ContentGuard from "@components/shared/ContentGuard/ContentGuard";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { useSession } from "@contexts/SessionContext";
import useFetch from "@hooks/useFetch";
import { Box, Button, Card, CardContent, FormControlLabel, Skeleton, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ThreatModel } from "@models/ThreatModel";
import { FuzzyRiskForecastResponse } from "@models/FuzzyRiskForecast";
import { LineChart } from "@mui/x-charts";

const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 14;
const DEFAULT_DAYS_AHEAD = 7;

interface ThreatSeries {
    threatModelId: string;
    label: string;
    data: (number | null)[];
}

interface ChartData {
    dates: string[];
    series: ThreatSeries[];
}

const RiskForecastPage = () => {

    const { session } = useSession();

    const [selectedThreatModelIds, setSelectedThreatModelIds] = useState<string[]>([]);
    const [daysAhead, setDaysAhead] = useState<number>(DEFAULT_DAYS_AHEAD);
    const [scaleToMax, setScaleToMax] = useState<boolean>(false);

    const [threatModels, setThreatModels] = useState<ThreatModel[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);

    const parcelId = session?.farm_parcel?.["@id"].split(":")[3];

    const { fetchData: fetchThreatModels, response: threatModelsResponse } = useFetch<ThreatModel[]>(
        'proxy/pdm/api/v1/threat-model/',
        { method: 'GET' }
    );

    const { fetchData: fetchForecast, response: forecastResponse, error: forecastError, loading: forecastLoading } = useFetch<FuzzyRiskForecastResponse>(
        'proxy/pdm/api/v1/fuzzy-risk/fc/forecast/?format=json',
        { method: 'POST' }
    );

    useEffect(() => {
        fetchThreatModels();
    }, []);

    useEffect(() => {
        if (Array.isArray(threatModelsResponse)) {
            setThreatModels(threatModelsResponse);
        }
    }, [threatModelsResponse]);

    const handleDisplayForecast = () => {
        if (!parcelId) return;
        fetchForecast({
            body: {
                parcel_id: parcelId,
                days_ahead: daysAhead,
                ...(selectedThreatModelIds.length > 0 ? { threat_model_ids: selectedThreatModelIds } : {}),
            },
        });
    };

    useEffect(() => {
        if (!Array.isArray(forecastResponse)) return;

        const dateSet = new Set<string>();
        const byThreatId = new Map<string, Map<string, number>>();
        const labelById = new Map<string, string>();

        forecastResponse.forEach(row => {
            dateSet.add(row.date);
            // Match row back to selected threat model by common_name (response has no id).
            const matchingModel = threatModels.find(tm =>
                tm.common_name === row.common_name && tm.scientific_name === row.scientific_name
            );
            const key = matchingModel?.id ?? `${row.scientific_name}::${row.common_name}`;
            const label = row.common_name || row.scientific_name;
            labelById.set(key, label);
            if (!byThreatId.has(key)) byThreatId.set(key, new Map());
            byThreatId.get(key)!.set(row.date, row.risk_score);
        });

        const dates = Array.from(dateSet).sort();
        const series: ThreatSeries[] = Array.from(byThreatId.entries()).map(([id, dateMap]) => ({
            threatModelId: id,
            label: labelById.get(id) ?? id,
            data: dates.map(d => dateMap.has(d) ? dateMap.get(d)! : null),
        }));

        setChartData({ dates, series });
    }, [forecastResponse, threatModels]);

    const handleDaysAheadChange = (raw: string) => {
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) {
            setDaysAhead(MIN_DAYS_AHEAD);
            return;
        }
        const clamped = Math.min(MAX_DAYS_AHEAD, Math.max(MIN_DAYS_AHEAD, parsed));
        setDaysAhead(clamped);
    };

    return (
        <>
            <ParcelSelectionModule></ParcelSelectionModule>
            <ContentGuard condition={session?.farm_parcel}>
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <GenericSelect<ThreatModel>
                        endpoint='proxy/pdm/api/v1/threat-model/'
                        data={threatModels}
                        label='Threat models'
                        selectedValue={selectedThreatModelIds}
                        setSelectedValue={setSelectedThreatModelIds}
                        getOptionLabel={item => item.common_name || item.scientific_name}
                        getOptionValue={item => item.id}
                        multiple
                    />
                    <TextField
                        type='number'
                        label='Days ahead'
                        value={daysAhead}
                        onChange={(e) => handleDaysAheadChange(e.target.value)}
                        slotProps={{ htmlInput: { min: MIN_DAYS_AHEAD, max: MAX_DAYS_AHEAD } }}
                        helperText={`Between ${MIN_DAYS_AHEAD} and ${MAX_DAYS_AHEAD} days`}
                    />
                    <Box>
                        <Button
                            onClick={handleDisplayForecast}
                            variant="contained"
                            disabled={!session?.farm_parcel || forecastLoading}
                        >
                            Display risk forecast
                        </Button>
                    </Box>
                    {forecastLoading && <Skeleton variant="rectangular" height={300} />}
                    {!forecastLoading && !forecastError && chartData && chartData.series.length > 0 && (() => {
                        const dataMax = chartData.series.reduce((max, s) => {
                            const seriesMax = s.data.reduce<number>((m, v) => v !== null && v > m ? v : m, 0);
                            return seriesMax > max ? seriesMax : max;
                        }, 0);
                        const yMax = scaleToMax ? Math.max(1, Math.ceil(dataMax)) : 100;
                        return (
                            <Card>
                                <CardContent>
                                    <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={2} flexWrap={'wrap'}>
                                        <Typography gutterBottom variant="h4">Risk forecast</Typography>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={scaleToMax}
                                                    onChange={(_, checked) => setScaleToMax(checked)}
                                                />
                                            }
                                            label="Scale to max value"
                                        />
                                    </Box>
                                    <Box display={'flex'} flexDirection={'column'} gap={2} overflow={'auto'}>
                                        <LineChart
                                            series={chartData.series.map(s => ({
                                                data: s.data,
                                                label: s.label,
                                                connectNulls: true,
                                                valueFormatter: (value) => value === null ? 'N/A' : `${value.toFixed(1)}`,
                                            }))}
                                            xAxis={[{
                                                scaleType: 'point',
                                                label: 'Date',
                                                data: chartData.dates,
                                            }]}
                                            yAxis={[{
                                                min: 0,
                                                max: yMax,
                                                label: 'Risk score',
                                            }]}
                                            height={400}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })()}
                    {!forecastLoading && !forecastError && chartData && chartData.series.length === 0 && (
                        <Typography variant="body1">No risk forecast data returned for the selected parameters.</Typography>
                    )}
                    {!forecastLoading && forecastError && (
                        <Typography variant="body1" color="error">{forecastError.message}</Typography>
                    )}
                </Box>
            </ContentGuard>
        </>
    );
};

export default RiskForecastPage;
