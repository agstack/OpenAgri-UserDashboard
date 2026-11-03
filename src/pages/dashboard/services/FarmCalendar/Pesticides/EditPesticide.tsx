import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { PesticideModel } from "@models/Pesticide";
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
    'hasPreharvestInterval',
    'hasCost',
    'isPricePer',
]);
const isReq = (k: string) => REQUIRED_KEYS.has(k);

const EditPesticidePage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const { id } = useParams();

    const [pesticide, setPesticide] = useState<PesticideModel>();

    const { fetchData, loading, response, error } = useFetch<PesticideModel>(
        `proxy/farmcalendar/api/v1/Pesticides/${id}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Pesticides/${id}/?format=json`,
        { method: 'PATCH' }
    );

    const { fetchData: deleteFetchData, error: deleteError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Pesticides/${id}/?format=json`,
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (response) setPesticide(response);
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading pesticide');
    }, [error]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error saving pesticide');
    }, [patchError]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting pesticide');
    }, [deleteError]);

    useEffect(() => {
        if (patchResponse) navigate('/pesticides');
    }, [patchResponse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPesticide(prev => {
            if (!prev) return prev;
            const next: any = { ...prev };
            next[name] = name === 'hasPreharvestInterval' ? (value === '' ? '' : parseInt(value, 10)) : value;
            return next;
        });
    };

    const fieldEmpty = (k: string) => {
        if (!pesticide) return true;
        const v = (pesticide as any)[k];
        if (v === undefined || v === null || v === '') return true;
        if (typeof v === 'number') return Number.isNaN(v);
        return !v.toString().trim();
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    const handleSave = () => {
        if (!pesticide) return;
        const body: any = {
            hasCommercialName: pesticide.hasCommercialName.trim(),
            description: pesticide.description?.trim() || null,
            hasCost: pesticide.hasCost.toString().trim(),
            isPricePer: pesticide.isPricePer.trim(),
            hasActiveSubstance: pesticide.hasActiveSubstance.trim(),
            isTargetedTowards: pesticide.isTargetedTowards.trim(),
            hasPreharvestInterval: pesticide.hasPreharvestInterval,
        };
        patchFetchData({ body });
    };

    const handleDelete = async () => {
        await deleteFetchData();
        navigate('/pesticides');
    };

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && pesticide && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{pesticide.hasCommercialName}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Commercial name" name="hasCommercialName"
                                        value={pesticide.hasCommercialName} onChange={handleChange}
                                        required={isReq('hasCommercialName')} error={isReq('hasCommercialName') && fieldEmpty('hasCommercialName')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Active substance" name="hasActiveSubstance"
                                        value={pesticide.hasActiveSubstance} onChange={handleChange}
                                        required={isReq('hasActiveSubstance')} error={isReq('hasActiveSubstance') && fieldEmpty('hasActiveSubstance')} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Targeted towards" name="isTargetedTowards"
                                        value={pesticide.isTargetedTowards} onChange={handleChange}
                                        required={isReq('isTargetedTowards')} error={isReq('isTargetedTowards') && fieldEmpty('isTargetedTowards')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 1, min: 0 } }} fullWidth margin="normal" label="Preharvest interval (days)" name="hasPreharvestInterval" type="number"
                                        value={pesticide.hasPreharvestInterval} onChange={handleChange}
                                        required={isReq('hasPreharvestInterval')} error={isReq('hasPreharvestInterval') && fieldEmpty('hasPreharvestInterval')} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01 } }} fullWidth margin="normal" label="Cost" name="hasCost" type="number"
                                        value={pesticide.hasCost} onChange={handleChange}
                                        required={isReq('hasCost')} error={isReq('hasCost') && fieldEmpty('hasCost')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Price per (unit)" name="isPricePer"
                                        value={pesticide.isPricePer} onChange={handleChange}
                                        required={isReq('isPricePer')} error={isReq('isPricePer') && fieldEmpty('isPricePer')} />
                                </Stack>
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" multiline rows={3}
                                    label="Description" name="description"
                                    value={pesticide.description ?? ''} onChange={handleChange} />
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
                            onClick={() => showDialog({ title: 'Delete this pesticide?', variant: 'yes-no', children: <></> })}>
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

export default EditPesticidePage;
