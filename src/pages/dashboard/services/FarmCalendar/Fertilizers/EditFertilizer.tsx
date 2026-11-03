import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FertilizerModel } from "@models/Fertilizer";
import { Box, Button, Card, CardContent, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import useDialog from "@hooks/useDialog";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

const REQUIRED_KEYS = new Set<string>([
    'hasCommercialName',
    'hasActiveSubstance',
    'isTargetedTowards',
    'hasNutrientConcentration',
    'hasCost',
    'isPricePer',
]);
const isReq = (k: string) => REQUIRED_KEYS.has(k);

const EditFertilizerPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const { id } = useParams();

    const [fertilizer, setFertilizer] = useState<FertilizerModel>();

    const { fetchData, loading, response, error } = useFetch<FertilizerModel>(
        `proxy/farmcalendar/api/v1/Fertilizers/${id}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Fertilizers/${id}/?format=json`,
        { method: 'PATCH' }
    );

    const { fetchData: deleteFetchData, error: deleteError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Fertilizers/${id}/?format=json`,
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (response) setFertilizer(response);
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading fertilizer');
    }, [error]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error saving fertilizer');
    }, [patchError]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting fertilizer');
    }, [deleteError]);

    useEffect(() => {
        if (patchResponse) navigate('/fertilizers');
    }, [patchResponse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFertilizer(prev => prev ? ({ ...prev, [name]: value }) : prev);
    };

    const fieldEmpty = (k: string) => {
        if (!fertilizer) return true;
        return !(fertilizer as any)[k]?.toString().trim();
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    const handleSave = () => {
        if (!fertilizer) return;
        const body: any = {
            hasCommercialName: fertilizer.hasCommercialName.trim(),
            description: fertilizer.description?.trim() || null,
            hasCost: fertilizer.hasCost.toString().trim(),
            isPricePer: fertilizer.isPricePer.trim(),
            hasActiveSubstance: fertilizer.hasActiveSubstance.trim(),
            isTargetedTowards: fertilizer.isTargetedTowards.trim(),
            hasNutrientConcentration: fertilizer.hasNutrientConcentration.trim(),
        };
        patchFetchData({ body });
    };

    const handleDelete = async () => {
        await deleteFetchData();
        navigate('/fertilizers');
    };

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && fertilizer && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{fertilizer.hasCommercialName}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Commercial name" name="hasCommercialName"
                                        value={fertilizer.hasCommercialName} onChange={handleChange}
                                        required={isReq('hasCommercialName')} error={isReq('hasCommercialName') && fieldEmpty('hasCommercialName')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Active substance" name="hasActiveSubstance"
                                        value={fertilizer.hasActiveSubstance} onChange={handleChange}
                                        required={isReq('hasActiveSubstance')} error={isReq('hasActiveSubstance') && fieldEmpty('hasActiveSubstance')} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Targeted towards" name="isTargetedTowards"
                                        value={fertilizer.isTargetedTowards} onChange={handleChange}
                                        required={isReq('isTargetedTowards')} error={isReq('isTargetedTowards') && fieldEmpty('isTargetedTowards')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Nutrient concentration" name="hasNutrientConcentration"
                                        value={fertilizer.hasNutrientConcentration} onChange={handleChange}
                                        required={isReq('hasNutrientConcentration')} error={isReq('hasNutrientConcentration') && fieldEmpty('hasNutrientConcentration')} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01 } }} fullWidth margin="normal" label="Cost" name="hasCost" type="number"
                                        value={fertilizer.hasCost} onChange={handleChange}
                                        required={isReq('hasCost')} error={isReq('hasCost') && fieldEmpty('hasCost')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Price per (unit)" name="isPricePer"
                                        value={fertilizer.isPricePer} onChange={handleChange}
                                        required={isReq('isPricePer')} error={isReq('isPricePer') && fieldEmpty('isPricePer')} />
                                </Stack>
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" multiline rows={3}
                                    label="Description" name="description"
                                    value={fertilizer.description ?? ''} onChange={handleChange} />
                            </Stack>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />}
                            loading={patchLoading} loadingPosition="start"
                            disabled={isFormInvalid || !canEdit} onClick={handleSave}>
                            Save changes
                        </Button>
                        <Button variant="contained" color="error" startIcon={<DeleteIcon />}
                            disabled={!canDelete}
                            onClick={() => showDialog({ title: 'Delete this fertilizer?', variant: 'yes-no', children: <></> })}>
                            Delete
                        </Button>
                    </Box>
                </Box>
            )}
            <GenericDialog {...dialogProps} onYes={handleDelete} />
            <GenericSnackbar type={snackbarState.type} message={snackbarState.message} open={snackbarState.open} onClose={closeSnackbar} />
        </>
    );
};

export default EditFertilizerPage;
