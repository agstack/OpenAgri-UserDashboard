import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import ActivityTypeForm, { ActivityTypeFormValues } from "./ActivityTypeForm";

const emptyValues: ActivityTypeFormValues = {
    name: '',
    description: '',
    category: '',
    background_color: '#1976d2',
    border_color: '#1976d2',
    text_color: '#ffffff',
};

const EditActivityTypePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const [values, setValues] = useState<ActivityTypeFormValues>(emptyValues);

    const { fetchData: fetchOne, response: getResponse, error: getError } = useFetch<FarmCalendarActivityTypeModel>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/${id}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: doPatch, response: patchResponse, error: patchError, loading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/${id}/`,
        { method: 'PATCH' }
    );

    useEffect(() => {
        if (id) fetchOne();
    }, [id]);

    useEffect(() => {
        if (getResponse) {
            setValues({
                name: getResponse.name ?? '',
                description: getResponse.description ?? '',
                category: getResponse.category ?? '',
                background_color: getResponse.background_color ?? '#1976d2',
                border_color: getResponse.border_color ?? '#1976d2',
                text_color: getResponse.text_color ?? '#ffffff',
            });
        }
    }, [getResponse]);

    useEffect(() => {
        if (getError) showSnackbar('error', 'Error loading activity type');
    }, [getError]);

    const handleSubmit = () => {
        doPatch({ body: values });
    };

    useEffect(() => {
        if (patchResponse) {
            showSnackbar('success', 'Activity type updated');
            navigate('/farm-calendar/activity-types');
        }
    }, [patchResponse]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error updating activity type');
    }, [patchError]);

    return (
        <>
            <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="h4">Edit calendar activity type</Typography>
                <ActivityTypeForm
                    values={values}
                    setValues={setValues}
                    onSubmit={handleSubmit}
                    loading={loading}
                    canEdit={canEdit}
                    submitLabel="Save Changes"
                />
            </Box>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default EditActivityTypePage;
