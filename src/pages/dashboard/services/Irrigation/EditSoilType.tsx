import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { SoilTypeModel } from "@models/SoilType";
import { Box, Button, Card, CardContent, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import { ServiceContextType } from "@layouts/services/IrrigationManagementLayout";

const REQUIRED_KEYS = new Set<string>(['soil_type', 'field_capacity', 'wilting_point']);
const isReq = (k: string) => REQUIRED_KEYS.has(k);

const inUnitRange = (v: number | null | undefined) =>
    v != null && !Number.isNaN(v) && v > 0 && v < 1;

const EditSoilTypePage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');

    const { id } = useParams();
    const soilId = id ?? '';

    const [formData, setFormData] = useState<SoilTypeModel | undefined>();

    const { fetchData, loading, response, error } = useFetch<SoilTypeModel>(
        `proxy/irrigation/api/v1/dataset/soil-types/${soilId}/`,
        { method: 'GET', noCache: true }
    );

    const { fetchData: putFetchData, response: putResponse, error: putError, loading: putLoading } = useFetch<any>(
        `proxy/irrigation/api/v1/dataset/soil-types/${soilId}/`,
        { method: 'PUT' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading soil type');
    }, [error]);

    useEffect(() => {
        if (putError) showSnackbar('error', 'Error saving soil type');
    }, [putError]);

    useEffect(() => {
        if (response) setFormData(response);
    }, [response]);

    useEffect(() => {
        if (putResponse) navigate('/soil-types');
    }, [putResponse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                [name]: name === 'soil_type' ? value : (value === '' ? NaN : parseFloat(value)),
            };
        });
    };

    const fieldEmpty = (key: string) => {
        if (!formData) return true;
        switch (key) {
            case 'soil_type': return !formData.soil_type.trim() || formData.soil_type.trim().length > 64;
            case 'field_capacity': return !inUnitRange(formData.field_capacity);
            case 'wilting_point': return !inUnitRange(formData.wilting_point);
            default: return false;
        }
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    const handleSave = () => {
        if (!formData) return;
        const { id: _id, ...rest } = formData;
        putFetchData({ body: { ...rest, soil_type: rest.soil_type.trim() } });
    };

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && formData && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{formData.soil_type}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <TextField
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" label="Soil type" name="soil_type"
                                    value={formData.soil_type} onChange={handleChange}
                                    required={isReq('soil_type')}
                                    error={isReq('soil_type') && fieldEmpty('soil_type')}
                                    helperText={formData.soil_type.trim().length > 64 ? 'Max 64 characters' : ''}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01, min: 0, max: 1 } }}
                                        fullWidth margin="normal" label="Field capacity (0 < x < 1)" name="field_capacity" type="number"
                                        value={Number.isNaN(formData.field_capacity) ? '' : formData.field_capacity}
                                        onChange={handleChange}
                                        required={isReq('field_capacity')}
                                        error={isReq('field_capacity') && fieldEmpty('field_capacity')}
                                    />
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01, min: 0, max: 1 } }}
                                        fullWidth margin="normal" label="Wilting point (0 < x < 1)" name="wilting_point" type="number"
                                        value={Number.isNaN(formData.wilting_point) ? '' : formData.wilting_point}
                                        onChange={handleChange}
                                        required={isReq('wilting_point')}
                                        error={isReq('wilting_point') && fieldEmpty('wilting_point')}
                                    />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained" color="primary"
                            startIcon={<SaveIcon />}
                            loading={putLoading}
                            loadingPosition="start"
                            disabled={isFormInvalid || !canEdit}
                            onClick={handleSave}
                        >
                            Save changes
                        </Button>
                    </Box>
                </Box>
            )}
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default EditSoilTypePage;
