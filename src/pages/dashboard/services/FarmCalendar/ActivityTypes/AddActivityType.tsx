import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ActivityTypeForm, { ActivityTypeFormValues } from "./ActivityTypeForm";

const emptyValues: ActivityTypeFormValues = {
    name: '',
    description: '',
    category: '',
    background_color: '#1976d2',
    border_color: '#1976d2',
    text_color: '#ffffff',
};

const AddActivityTypePage = () => {
    const navigate = useNavigate();
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('add');

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const [values, setValues] = useState<ActivityTypeFormValues>(emptyValues);

    const { fetchData, response, error, loading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/`,
        { method: 'POST' }
    );

    const handleSubmit = () => {
        fetchData({ body: values });
    };

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Activity type created');
            navigate('/farm-calendar/activity-types');
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error creating activity type');
    }, [error]);

    return (
        <>
            <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="h4">Add calendar activity type</Typography>
                <ActivityTypeForm
                    values={values}
                    setValues={setValues}
                    onSubmit={handleSubmit}
                    loading={loading}
                    canEdit={canEdit}
                    submitLabel="Create"
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

export default AddActivityTypePage;
