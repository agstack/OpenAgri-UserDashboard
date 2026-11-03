import ParcelSelectionModule from "@components/dashboard/ParcelSelectionModule/ParcelSelectionModule";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useSnackbar from "@hooks/useSnackbar";
import { Button, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { EventInput } from '@fullcalendar/core';
import useFetch from "@hooks/useFetch";
import { FarmCalendarActivityModel } from "@models/FarmCalendarActivity";
import { useNavigate, useOutletContext } from "react-router-dom";
import StyledFullCalendar from "@components/shared/styled/StyledFullCalendar/StyledFullCalendar";
import dayjs from "dayjs";
import { useSession } from "@contexts/SessionContext";
import ContentGuard from "@components/shared/ContentGuard/ContentGuard";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

const FarmCalendarPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');

    const navigate = useNavigate();

    const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

    const [activityTypes, setActivityTypes] = useState<FarmCalendarActivityTypeModel[]>([]);

    const { session } = useSession();

    const [activities, setActivities] = useState<FarmCalendarActivityModel[]>([]);
    const [activitiesError, setActivitiesError] = useState<Error | null>(null);

    const fetchActivitiesByMonth = async () => {
        if (!dateRange.start || !dateRange.end || !session?.farm_parcel || !session.user.token) return;
        const parcelId = session.farm_parcel["@id"].split(':')[3];
        const apiUrl = (window as any).env?.VITE_API_URL ?? import.meta.env.VITE_API_URL;
        const months: { from: string; to: string }[] = [];
        let cursor = dayjs(dateRange.start).startOf('month');
        const end = dayjs(dateRange.end).endOf('month');
        while (cursor.isBefore(end) || cursor.isSame(end, 'month')) {
            months.push({
                from: cursor.startOf('month').format('YYYY-MM-DD'),
                to: cursor.endOf('month').format('YYYY-MM-DD'),
            });
            cursor = cursor.add(1, 'month');
        }
        setActivitiesError(null);
        try {
            const responses = await Promise.all(months.map(m =>
                fetch(`${apiUrl}proxy/farmcalendar/api/v1/FarmCalendarActivities/?parcel=${parcelId}&format=json&fromDate=${m.from}&toDate=${m.to}`, {
                    headers: { Authorization: `Bearer ${session.user.token}` },
                }).then(r => r.ok ? r.json() as Promise<FarmCalendarActivityModel[]> : Promise.reject(new Error(`HTTP ${r.status}`)))
            ));
            const merged = responses.flat();
            const seen = new Set<string>();
            const deduped = merged.filter(a => {
                if (seen.has(a["@id"])) return false;
                seen.add(a["@id"]);
                return true;
            });
            setActivities(deduped);
        } catch (err) {
            setActivitiesError(err as Error);
        }
    };

    const { fetchData: activityTypesFetchData, response: activityTypesResponse, error: activityTypesError } = useFetch<FarmCalendarActivityTypeModel[]>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/?format=json`,
        {
            method: 'GET',
        }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        activityTypesFetchData();
    }, [])

    useEffect(() => {
        if (activityTypesResponse) {
            setActivityTypes(activityTypesResponse);
        }
    }, [activityTypesResponse])

    useEffect(() => {
        if (activityTypesError) {
            showSnackbar('error', 'Error loading activity types');
        }
    }, [activityTypesError])

    useEffect(() => {
        if (dateRange.start && dateRange.end && session?.farm_parcel) {
            fetchActivitiesByMonth();
        }
    }, [session?.farm_parcel, dateRange])

    useEffect(() => {
        if (activitiesError) {
            showSnackbar('error', 'Error loading activities');
        }
    }, [activitiesError])

    const calendarEvents = useMemo(() => {
        return activities.map((event): EventInput => ({
            id: event['@id'],
            title: event.title,
            start: event.hasStartDatetime,
            end: event.hasEndDatetime,
            extendedProps: {
                details: event.details,
                activityType: event.activityType,
            }
        }));
    }, [activities]);

    return (
        <>
            <ParcelSelectionModule></ParcelSelectionModule>
            <ContentGuard condition={session?.farm_parcel}>
                <>
                    <Stack direction="row" spacing={2} sx={{ marginBottom: 2 }}>
                        <Button
                            onClick={() => navigate('register-activity', { state: { activityTypes: activityTypes } })}
                            disabled={!canAdd}
                            variant="contained">
                            Register new calendar activity
                        </Button>
                        <Button
                            onClick={() => navigate('activity-types')}
                            variant="contained">
                            Manage calendar activity types
                        </Button>
                    </Stack>
                    <StyledFullCalendar
                        events={calendarEvents}
                        eventClick={
                            (info) => {
                                const api = activityTypes.find(a => { return a["@id"].split(":")[3] === info.event.extendedProps.activityType["@id"].split(":")[3] })?.activity_endpoint
                                navigate(`edit-activity/${info.event.id.split(":")[3]}`, { state: { api: api, activityTypes: activityTypes } })
                            }
                        }
                        onDateRangeChange={setDateRange}
                    />
                </>
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

export default FarmCalendarPage;