import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
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
import { Box, Typography } from "@mui/material";
import { activityModelFactory } from "@utils/activityModelFactory";
import { useEffect, useState } from "react";
import ActivityDynamicCRUDActions from "@components/dashboard/services/FarmCalendar/ActivityDynamicCRUDActions/ActivityDynamicCRUDActions";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import useFetch from "@hooks/useFetch";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useSnackbar from "@hooks/useSnackbar";
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
    activityTypes: FarmCalendarActivityTypeModel[] | undefined;
}

const RegisterCalendarActivityPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    const state = location.state as LocationState;
    const activityTypes = state?.activityTypes;

    const [selectedActivityType, setSelectedActivityType] = useState<string>('');
    const [api, setAPI] = useState<string>('');

    const [activityData, setActivityData] = useState<BaseActivityModel | null>(null);

    const { fetchData, loading, response, error } = useFetch<any>(
        api ? `proxy/farmcalendar${api}` : '',
        { method: 'POST' }
    );

    useEffect(() => {
        if (selectedActivityType) {
            const selectedActivityTypeObject = activityTypes?.find(at => at["@id"] === selectedActivityType);
            const api = selectedActivityTypeObject?.activity_endpoint ?? '';
            setAPI(api);

            const getEmptyModel = activityModelFactory[api];

            if (getEmptyModel && selectedActivityTypeObject) {
                setActivityData(getEmptyModel(selectedActivityTypeObject["@id"].split(':')[3]));
            } else {
                console.warn(`No empty model factory found for endpoint: ${api}`);
                setActivityData(null);
            }
        } else {
            setActivityData(null);
        }
    }, [selectedActivityType]);

    const handlePost = (activityToSave: BaseActivityModel) => {
        console.log({ body: activityToSave });
        fetchData({ body: activityToSave })
    };

    useEffect(() => {
        if (error) showSnackbar('error', 'Error adding activity');
    }, [error]);

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Activity updated successfully.');
            navigate("/farm-calendar");
        }
    }, [response]);

    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('add');

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
                onAdd={handlePost}
                loading={loading}
                canEdit={canEdit}
            />
        );
    };

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Typography variant={'h4'} >Register new activity</Typography>

                <GenericSelect<FarmCalendarActivityTypeModel>
                    endpoint=''
                    data={activityTypes}
                    label='Activity type'
                    selectedValue={selectedActivityType}
                    setSelectedValue={setSelectedActivityType}
                    getOptionLabel={item => `${item.name}`}
                    getOptionValue={item => item["@id"]}
                />

                {activityData && renderForm()}
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

export default RegisterCalendarActivityPage;