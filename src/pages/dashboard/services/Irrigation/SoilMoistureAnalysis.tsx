import { useMemo, useState, useEffect } from 'react';
import {
    Chart,
    Series,
    Title,
    Tooltip
} from '@highcharts/react';
import * as Highcharts from 'highcharts';

import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { SoilTypeModel } from "@models/SoilType";
import useFetch from "@hooks/useFetch";
import { DatasetResponse, DatasetRow } from "@models/SoilMoisture";
import { Box, Button, Card, CardContent, Skeleton, Typography } from "@mui/material";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';

import DeleteIcon from '@mui/icons-material/Delete';
import useDialog from '@hooks/useDialog';
import GenericDialog from '@components/shared/GenericDialog/GenericDialog';
import GenericSnackbar from '@components/shared/GenericSnackbar/GenericSnackbar';
import useSnackbar from '@hooks/useSnackbar';
import { ServiceContextType } from '@layouts/services/IrrigationManagementLayout';
import { useOutletContext } from 'react-router-dom';

dayjs.extend(utc);

const SoilMoistureAnalysisPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canDelete = actions.includes('delete');

    const [selectedDataset, setSelectedDataset] = useState<string>('');
    const [selectedSoil, setSelectedSoil] = useState<string>('');

    const { fetchData: datapointsFetchData, loading: datapointsLoading, response: datapointsResponse } = useFetch<DatasetResponse>(
        `proxy/irrigation/api/v1/dataset/${selectedDataset}/irrigation-datapoints/?formatting=JSON${selectedSoil && '&soil=' + selectedSoil}`,
        {
            method: 'GET'
        }
    )

    useEffect(() => {
        if (selectedDataset) {
            datapointsFetchData();
        }
    }, [selectedDataset])

    useEffect(() => {
        if (selectedSoil) {
            if (selectedDataset) {
                datapointsFetchData();
            }
        }
    }, [selectedSoil])


    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    const { dialogProps, showDialog } = useDialog();

    const handleCloseDialog = () => {
        dialogProps.onClose();
    };

    const { fetchData: deleteFetchData, response: deleteResponse, error: deleteError } = useFetch<any>( // TODO: add loading and add loading handling in generic yes-no dialog
        `proxy/irrigation/api/v1/dataset/${selectedDataset}/`,
        {
            method: 'DELETE'
        }
    );

    const handleDelete = () => {
        console.log("dataset to delete:", selectedDataset);
        deleteFetchData();
    };

    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (deleteResponse) {
            setSelectedDataset('');
            setRefreshKey(prev => prev + 1);
            showSnackbar('success', "Successfully deleted dataset");
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (deleteError) {
            showSnackbar('error', "An error occurred while deleting the dataset");
        }
    }, [deleteError]);

    const { seriesData, highDoseDays, horizontalPlotLines } = useMemo(() => {
        if (!datapointsResponse || datapointsResponse.data_points.length === 0) {
            return { seriesData: [], highDoseDays: [], horizontalPlotLines: [] };
        }

        const { data_points, high_dose_irrigation_days, field_capacity, stress_level, wilting_point } = datapointsResponse;

        console.log(field_capacity, stress_level, wilting_point);

        const soilMoistureKeys = ['soil_moisture_10', 'soil_moisture_20', 'soil_moisture_30', 'soil_moisture_40', 'soil_moisture_50', 'soil_moisture_60'];

        const preparedSeriesData = soilMoistureKeys.map(key => {
            const depth = key.split('_')[2];

            const data = data_points
                .map(d => {
                    const timestamp = dayjs.utc(d.date).valueOf();
                    const value = d[key as keyof DatasetRow] as number;
                    return [timestamp, value] as [number, number];
                })
                .filter(([_ts, val]) => val !== 0) as [number, number][];

            return {
                name: `Soil Moisture ${depth}cm`,
                data: data,
                key: key,
            };
        });

        const thresholds = [
            { value: field_capacity * 100, label: 'Field capacity' },
            { value: stress_level * 100, label: 'Stress level' },
            { value: wilting_point * 100, label: 'Wilting point' }
        ];

        const preparedThresholdLines = thresholds.map((t) => {
            const plotLine: Highcharts.YAxisPlotLinesOptions = {
                value: t.value,
                color: 'black',
                dashStyle: 'Solid',
                width: 2,
                zIndex: 3,
                label: {
                    text: t.label,
                    align: 'right',
                    x: -10,
                    style: {
                        fontSize: '10px',
                        fontWeight: 'bold'
                    },
                    y: t.label === 'Stress level' ? 0 : (t.label === 'Field capacity' ? -10 : 10)
                }
            }
            return plotLine;
        });

        console.log(preparedThresholdLines);

        const preparedhighDoseDays = high_dose_irrigation_days.map((dateStr) => {
            const timestamp = dayjs.utc(dateStr).valueOf();

            const plotLineProps: Highcharts.XAxisPlotLinesOptions = {
                value: timestamp,
                color: '#FF0000',
                dashStyle: 'LongDash',
                width: 1,
                zIndex: -5,
            };
            return plotLineProps;
        });

        return { seriesData: preparedSeriesData, highDoseDays: preparedhighDoseDays, horizontalPlotLines: preparedThresholdLines };

    }, [datapointsResponse]);

    console.log(seriesData);

    const chartReady = !datapointsLoading && datapointsResponse && seriesData.length > 0;

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={3}>
                <Card variant="outlined">
                    <CardContent>
                        <Box display={'flex'} flexDirection={'column'} gap={2}>
                            <Box display={'flex'} flexDirection={'column'} gap={2}>
                                <Typography variant="body1">
                                    Select a dataset to see its soil moisture analysis. Also select a soil type to dynamically adjust the thresholds
                                </Typography>
                                <Box display={'flex'} gap={2}>
                                    <GenericSelect<string>
                                        key={refreshKey}
                                        endpoint='proxy/irrigation/api/v1/dataset/'
                                        label='Datasets'
                                        selectedValue={selectedDataset}
                                        setSelectedValue={setSelectedDataset}
                                        getOptionLabel={item => item}
                                        getOptionValue={item => item}>
                                    </GenericSelect>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        // loading={loading}
                                        disabled={!selectedDataset || !canDelete}
                                        loadingPosition="start"
                                        onClick={() => {
                                            showDialog({
                                                title: `Are you sure you want to delete this dataset?`,
                                                variant: 'yes-no',
                                                children: <></>
                                            });
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                                <GenericSelect<SoilTypeModel, SoilTypeModel[]>
                                    endpoint='proxy/irrigation/api/v1/dataset/soil-types/'
                                    method="GET"
                                    label='Soil type'
                                    selectedValue={selectedSoil}
                                    setSelectedValue={setSelectedSoil}
                                    getOptionLabel={item => item.soil_type}
                                    getOptionValue={item => item.id}
                                />
                            </Box>
                            <Box width={'100%'}>
                                {datapointsLoading && <Skeleton variant="rectangular" width={'100%'} height={400} />}

                                {selectedDataset && chartReady && (
                                    <Chart options={
                                        {
                                            chart:
                                            {
                                                backgroundColor: 'transparent'
                                            },
                                            plotOptions: {
                                                series: {
                                                    marker: {
                                                        enabled: false
                                                    }
                                                }
                                            },
                                            xAxis: { type: 'datetime', plotLines: highDoseDays },
                                            yAxis: {
                                                title: { text: 'Soil Moisture (%)' },
                                                plotLines: horizontalPlotLines,
                                                min: 0,
                                                startOnTick: false,
                                                endOnTick: false
                                            },
                                        }}>
                                        <Title>Soil Moisture Analysis and Irrigation Events</Title>
                                        {seriesData.map(series => (
                                            <Series
                                                type='line'
                                                key={series.key}
                                                options={{
                                                    name: series.name
                                                }}
                                                data={series.data}
                                            />
                                        ))}

                                        <Tooltip
                                            shared={true}
                                            valueSuffix='%'
                                        />
                                    </Chart>
                                )}

                                {!datapointsLoading && !datapointsResponse && (
                                    <Typography variant="caption" color="text.secondary" p={2}>
                                        Please select a dataset to load soil moisture readings.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
                {selectedDataset && chartReady &&
                    <>
                        <Card variant="outlined">
                            <CardContent>
                                <Box display={'flex'} flexDirection={'column'} gap={2}>
                                    <Box display={'flex'} flexDirection={'column'} gap={1}>
                                        <Typography variant="h6">Thresholds:</Typography>
                                        <Typography variant="body1">
                                            Field capacity: {Math.round(Number(horizontalPlotLines[0].value))}%
                                        </Typography>
                                        <Typography variant="body1">
                                            Stress level: {Math.round(Number(horizontalPlotLines[1].value))}%
                                        </Typography>
                                        <Typography variant="body1">
                                            Wilting point: {Math.round(Number(horizontalPlotLines[2].value))}%
                                        </Typography>
                                    </Box>
                                    <Box display={'flex'} flexDirection={'column'} gap={2}>
                                        <Typography variant="h6">High dose irrigation days: {highDoseDays.length}</Typography>
                                        <Typography variant="body1">
                                            Estimated dates:&nbsp;
                                            {highDoseDays.map((d, index) => {
                                                return dayjs(d.value).format('dddd MMM D') + `${(index < highDoseDays.length - 1) ? ', ' : ''}`
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </>
                }
            </Box>
            <GenericDialog {...dialogProps} onClose={handleCloseDialog} onYes={handleDelete} />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default SoilMoistureAnalysisPage;