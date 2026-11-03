import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import { SoilTypeModel } from "@models/SoilType";
import { AddSoilTypeProps } from "./AddSoilType.types";

const REQUIRED_KEYS = new Set<string>(['soil_type', 'field_capacity', 'wilting_point']);
const isReq = (k: string) => REQUIRED_KEYS.has(k);

const inUnitRange = (v: number | null) =>
    v != null && !Number.isNaN(v) && v > 0 && v < 1;

type SoilCreate = Omit<SoilTypeModel, 'id'>;

const emptyForm: SoilCreate = {
    soil_type: '',
    field_capacity: NaN,
    wilting_point: NaN,
};

const AddSoilType: React.FC<AddSoilTypeProps> = ({ onAction, existingNames = [] }) => {
    const [formData, setFormData] = useState<SoilCreate>({ ...emptyForm });

    const { fetchData, response, error, loading } = useFetch<any>(
        'proxy/irrigation/api/v1/dataset/soil-types/',
        { method: 'POST' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Soil type added successfully');
            setFormData({ ...emptyForm });
            onAction && onAction();
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'An error occurred');
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'soil_type' ? value : (value === '' ? NaN : parseFloat(value)),
        }));
    };

    const isDuplicate = existingNames.includes(formData.soil_type.trim());

    const fieldEmpty = (key: string) => {
        switch (key) {
            case 'soil_type': return !formData.soil_type.trim();
            case 'field_capacity': return !inUnitRange(formData.field_capacity);
            case 'wilting_point': return !inUnitRange(formData.wilting_point);
            default: return false;
        }
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k)) || isDuplicate;

    const handlePost = () => {
        fetchData({ body: { ...formData, soil_type: formData.soil_type.trim() } });
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Stack direction={'column'} spacing={2}>
                <TextField
                    fullWidth margin="normal" label="Soil type" name="soil_type"
                    value={formData.soil_type} onChange={handleChange}
                    required={isReq('soil_type')}
                    error={(isReq('soil_type') && fieldEmpty('soil_type')) || isDuplicate}
                    helperText={isDuplicate ? 'Soil type already exists' : ''}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        fullWidth margin="normal" label="Field capacity (0 < x < 1)" name="field_capacity" type="number"
                        slotProps={{ htmlInput: { step: 0.01, min: 0, max: 1 } }}
                        value={Number.isNaN(formData.field_capacity) ? '' : formData.field_capacity}
                        onChange={handleChange}
                        required={isReq('field_capacity')}
                        error={isReq('field_capacity') && fieldEmpty('field_capacity')}
                    />
                    <TextField
                        fullWidth margin="normal" label="Wilting point (0 < x < 1)" name="wilting_point" type="number"
                        slotProps={{ htmlInput: { step: 0.01, min: 0, max: 1 } }}
                        value={Number.isNaN(formData.wilting_point) ? '' : formData.wilting_point}
                        onChange={handleChange}
                        required={isReq('wilting_point')}
                        error={isReq('wilting_point') && fieldEmpty('wilting_point')}
                    />
                </Stack>
            </Stack>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="contained" color="primary"
                    startIcon={<AddIcon />}
                    loading={loading}
                    loadingPosition="start"
                    disabled={isFormInvalid}
                    onClick={handlePost}
                >
                    Add soil type
                </Button>
            </Box>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </Box>
    );
};

export default AddSoilType;
