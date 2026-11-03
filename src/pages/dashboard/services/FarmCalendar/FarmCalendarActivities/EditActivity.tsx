import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { Box, Skeleton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import {
    BaseActivityModel,
    AddRawMaterialOperationModel,
    AnimalActivityModel,
    AnimalLactatingActivityModel,
    CompostOperationModel,
    CompostTurningOperationModel,
    CropGrowthStageObservationModel,
    CropProtectionOperationModel,
    CropStressIndicatorObservationModel,
    DiseaseDetectionModel,
    FertilizationOperationModel,
    GenericActivityModel,
    GenericAlertModel,
    GenericObservationModel,
    IrrigationOperationModel,
    SprayingRecommendationModel,
    VigorEstimationModel,
    YieldPredictionModel
} from '@models/FarmCalendarActivities';
import ActivityDynamicCRUDActions from "@components/dashboard/services/FarmCalendar/ActivityDynamicCRUDActions/ActivityDynamicCRUDActions";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

const ActivityFormComponentMap: { [key: string]: React.FC<any> } = {
    'AddRawMaterialOperation': (props) => <ActivityDynamicCRUDActions<AddRawMaterialOperationModel> {...props} />,
    'CompostOperation': (props) => <ActivityDynamicCRUDActions<CompostOperationModel> {...props} />,
    'CompostTurningOperation': (props) => <ActivityDynamicCRUDActions<CompostTurningOperationModel> {...props} />,
    'CropGrowthStageObservation': (props) => <ActivityDynamicCRUDActions<CropGrowthStageObservationModel> {...props} />,
    'CropProtectionOperation': (props) => <ActivityDynamicCRUDActions<CropProtectionOperationModel> {...props} />,
    'CropStressIndicatorObservation': (props) => <ActivityDynamicCRUDActions<CropStressIndicatorObservationModel> {...props} />,
    'DiseaseDetection': (props) => <ActivityDynamicCRUDActions<DiseaseDetectionModel> {...props} />,
    'FertilizationOperation': (props) => <ActivityDynamicCRUDActions<FertilizationOperationModel> {...props} />,
    'FarmCalendarActivity': (props) => <ActivityDynamicCRUDActions<GenericActivityModel> {...props} />,
    'Alert': (props) => <ActivityDynamicCRUDActions<GenericAlertModel> {...props} />,
    'Observation': (props) => <ActivityDynamicCRUDActions<GenericObservationModel> {...props} />,
    'IrrigationOperation': (props) => <ActivityDynamicCRUDActions<IrrigationOperationModel> {...props} />,
    'SprayingRecommendation': (props) => <ActivityDynamicCRUDActions<SprayingRecommendationModel> {...props} />,
    'VigorEstimation': (props) => <ActivityDynamicCRUDActions<VigorEstimationModel> {...props} />,
    'YieldPrediction': (props) => <ActivityDynamicCRUDActions<YieldPredictionModel> {...props} />,
    'AnimalActivity': (props) => <ActivityDynamicCRUDActions<AnimalActivityModel> {...props} />,
    'AnimalLactatingActivity': (props) => <ActivityDynamicCRUDActions<AnimalLactatingActivityModel> {...props} />,
};

interface LocationState {
    api: string | undefined;
    activityTypes: FarmCalendarActivityTypeModel[] | undefined;
}

const EditCalendarActivityPage = () => {
    const [activityData, setActivityData] = useState<any | null>(null);
    const [pageTitle, setPageTitle] = useState<string>('');

    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state as LocationState;
    const api = state?.api;
    const activityTypes = state?.activityTypes;

    const { fetchData, loading, response, error } = useFetch<any>(
        api ? `proxy/farmcalendar${api}${id}/?format=json` : '',
        { method: 'GET' }
    );
    const { fetchData: patchFetchData, loading: editLoading, response: editResponse, error: editError } = useFetch<any>(
        api ? `proxy/farmcalendar${api}${id}/?format=json` : '',
        { method: 'PUT' }
    );
    const { fetchData: deleteFetchData, loading: deleteLoading, response: deleteResponse, error: deleteError } = useFetch<any>(
        api ? `proxy/farmcalendar${api}${id}/?format=json` : '',
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const isMutating = editLoading || deleteLoading;

    useEffect(() => {
        if (api) fetchData();
        else {
            showSnackbar('error', 'API path not specified.');
            navigate('/farm-calendar');
        }
    }, [api]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading activity');
        if (editError) showSnackbar('error', 'Error editing activity');
        if (deleteError) showSnackbar('error', 'Error deleting activity');
    }, [error, editError, deleteError]);

    useEffect(() => {
        if (response) {
            setActivityData(response);
            setPageTitle(`Edit ${response.title}`);
        }
    }, [response]);

    useEffect(() => {
        if (editResponse) {
            showSnackbar('success', 'Activity updated successfully.');
            navigate("/farm-calendar");
        }
        if (deleteResponse) {
            showSnackbar('success', 'Activity deleted successfully.');
            navigate("/farm-calendar");
        }
    }, [editResponse, deleteResponse]);

    const handlePatch = (activityToSave: BaseActivityModel) => {
        patchFetchData({ body: activityToSave });
    };

    const handleDelete = () => {
        deleteFetchData();
    };

    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const renderForm = () => {
        if (!activityData) return null;

        const activityType = activityData['@type'];
        const FormComponent = ActivityFormComponentMap[activityType];

        if (!FormComponent) {
            return <Typography color="error">Unknown activity type: {activityType}</Typography>;
        }

        return (
            <FormComponent
                activity={activityData}
                activityTypes={activityTypes}
                onSave={handlePatch}
                onDelete={handleDelete}
                loading={isMutating}
                canEdit={canEdit}
                canDelete={canDelete}
            />
        );
    };

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Typography variant={'h4'} >{pageTitle}</Typography>

                {loading && <Skeleton variant="rectangular" height={400} />}

                {!loading && activityData && renderForm()}

                {error && !loading && (
                    <Typography color="error">Could not load activity details.</Typography>
                )}
            </Box>

            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default EditCalendarActivityPage;