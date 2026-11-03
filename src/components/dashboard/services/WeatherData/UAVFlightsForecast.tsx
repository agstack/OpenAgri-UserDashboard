import ContentGuard from "@components/shared/ContentGuard/ContentGuard";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import { useSession } from "@contexts/SessionContext";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { UAVFlightForecastModel, UAVStatus } from "@models/UAVFlightForecast";
import { Box, Card, CardContent, Chip, ChipProps, Skeleton, SvgIcon, Tooltip, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AgriculturalMachine } from "@models/AgriculturalMachine";

interface ModelData {
    status?: UAVStatus
    weather_params?: {
        precipitation: number;
        rain: number;
        temp: number;
        wind: number;
    }
}
interface TimeData {
    [model: string]: ModelData;
}
interface DailyData {
    [time: string]: TimeData;
}
interface FormattedUAVData {
    [date: string]: DailyData;
}

const getStatusColor = (status?: UAVStatus): ChipProps['color'] => {
    switch (status) {
        case 'OK':
            return 'success';
        case 'MARGINAL':
            return 'warning';
        case 'NOT OK':
            return 'error';
    }
};

const UAVFlightsForecast = () => {
    const { session } = useSession();

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const [loadingFormat, setLoadingFormat] = useState<boolean>(false);

    const [agriMachines, setAgriMachines] = useState<string[]>([]);

    const [formattedData, setFormattedData] = useState<FormattedUAVData | null>(null);

    const { fetchData: uavFetchData, loading: uavLoading, response: uavResponse, error: uavError } = useFetch<UAVFlightForecastModel[]>(
        `proxy/weather_data/api/data/flight-forecast5/?lat=${session?.farm_parcel?.location.lat}&lon=${session?.farm_parcel?.location.long}`
        + `${agriMachines.map((am) => { return '&uavmodels=' + am })}`,
        {
            method: 'GET',
        }
    );

    const { fetchData: agriMachineFetchData, loading: agriMachinesLoading, response: agriMachinesResponse, error: agriMachinesError } = useFetch<AgriculturalMachine[]>(
        `proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json`,
        {
            method: 'GET',
        }
    );

    useEffect(() => {
        if (session?.farm_parcel) {
            agriMachineFetchData();
        }
    }, [session?.farm_parcel])

    useEffect(() => {
        setLoadingFormat(true);
        if (uavResponse && Array.isArray(uavResponse)) {
            const processedData = uavResponse.reduce<FormattedUAVData>((accumulator, currentItem) => {
                const { timestamp, status, weather_params, uav_model } = currentItem;
                const [date, timeWithZ] = timestamp.split('T');
                const time = timeWithZ.replace('Z', '');

                if (!accumulator[date]) { accumulator[date] = {}; }
                if (!accumulator[date][time]) { accumulator[date][time] = {}; }
                if (!accumulator[date][time][uav_model]) { accumulator[date][time][uav_model] = {}; }

                accumulator[date][time][uav_model].status = status;
                accumulator[date][time][uav_model].weather_params = weather_params;

                setLoadingFormat(false);
                return accumulator;
            }, {});
            setFormattedData(processedData);
        }
    }, [uavResponse])

    useEffect(() => {
        if (agriMachinesResponse) {
            const agriMachinesArray = agriMachinesResponse.flatMap((am) => {
                return am.model
            })
            setAgriMachines(agriMachinesArray)
        }

    }, [agriMachinesResponse])

    useEffect(() => {
        if (agriMachines.length) {
            console.log(agriMachines);
            uavFetchData();
        }
    }, [agriMachines])

    useEffect(() => {
        if (agriMachinesError) {
            showSnackbar('error', 'Error loading agri machines');
        }
    }, [agriMachinesError])

    useEffect(() => {
        if (uavError) {
            showSnackbar('error', 'Error loading UAV flights');
        }
    }, [uavError])

    return (
        <>
            <ContentGuard condition={session?.farm_parcel}>
                {(uavLoading || loadingFormat || agriMachinesLoading) && <Skeleton variant="rectangular" height={48} />}
                {!(uavLoading || loadingFormat || agriMachinesLoading) &&
                    <Box display={'flex'} flexDirection={'column'} gap={2}>
                        {formattedData && Object.entries(formattedData).map(([date, dailyData]: [string, DailyData]) => {
                            return <Card key={`id-date-${date}`}>
                                <CardContent>
                                    <Typography gutterBottom variant="h4">{dayjs(date).format('dddd, D/MMM/YYYY')}</Typography>
                                    <Box display={'flex'} flexDirection={'column'} gap={2} sx={{ overflowX: 'auto', py: 1 }}>
                                        <Box display={'flex'} flex={1} justifyContent={'space-between'} alignItems={'center'} gap={2}>
                                            <Box display={'flex'} alignItems={'center'} flex={1} minWidth={100}>&nbsp;</Box>
                                            {agriMachines.sort((a, b) => a.localeCompare(b)).map((ag: string) => {
                                                return <Box display={'flex'} alignItems={'center'} flex={1} fontWeight={'bold'} justifyContent={'center'} minWidth={100}>{ag}</Box>
                                            })}
                                        </Box>
                                        {Object.entries(dailyData).sort().map(([time, timeData]: [string, TimeData]) => {
                                            return <Fragment key={`id-time-${date}-${time}`}>
                                                <Box display={'flex'} flex={1} justifyContent={'space-between'} alignItems={'center'} gap={2}>
                                                    <Box display={'flex'} alignItems={'center'} gap={1} flex={1} minWidth={100}>
                                                        <SvgIcon children={<AccessTimeIcon />} />
                                                        {dayjs(`${date} ${time}`).format('HH:mm')}
                                                    </Box>
                                                    {Object.entries(timeData).sort((a, b) => a[0].localeCompare(b[0])).map(([model, modelData]: [string, ModelData]) => {
                                                        return <Box key={`id-time-${date}-${time}-${model}`} display={'flex'} justifyContent={'center'} flex={1} minWidth={100}>
                                                            <Tooltip
                                                                title={
                                                                    <>
                                                                        <Typography color="inherit" variant="subtitle1" component="div">
                                                                            Weather details
                                                                        </Typography>
                                                                        <Typography variant="body2">Temperature: {modelData.weather_params?.temp}°C</Typography>
                                                                        <Typography variant="body2">Rainfall in the last hour: {Number(modelData.weather_params?.rain).toFixed(2)}mm</Typography>
                                                                        <Typography variant="body2">Precipitation: {Number(modelData.weather_params?.precipitation) * 100}%</Typography>
                                                                        <Typography variant="body2">Wind: {modelData.weather_params?.wind}km/h</Typography>
                                                                    </>
                                                                }
                                                                placement="top"
                                                                arrow
                                                            >
                                                                <Chip label={modelData.status} color={getStatusColor(modelData.status)} />
                                                            </Tooltip>
                                                        </Box>
                                                    })}
                                                </Box>
                                            </Fragment>
                                        })}
                                    </Box>
                                </CardContent>
                            </Card>
                        })}
                    </Box>
                }
            </ContentGuard>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default UAVFlightsForecast;
