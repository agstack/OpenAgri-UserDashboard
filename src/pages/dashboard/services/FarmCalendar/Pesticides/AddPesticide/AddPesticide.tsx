import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import { AddPesticideProps } from "./AddPesticide.types";

const REQUIRED_KEYS = new Set<string>([
    'hasCommercialName',
    'hasActiveSubstance',
    'isTargetedTowards',
    'hasPreharvestInterval',
    'hasCost',
    'isPricePer',
]);
const isReq = (k: string) => REQUIRED_KEYS.has(k);

interface PesticideCreate {
    hasCommercialName: string;
    description: string;
    hasCost: string;
    isPricePer: string;
    hasActiveSubstance: string;
    isTargetedTowards: string;
    hasPreharvestInterval: string;
}

const emptyForm: PesticideCreate = {
    hasCommercialName: '',
    description: '',
    hasCost: '',
    isPricePer: '',
    hasActiveSubstance: '',
    isTargetedTowards: '',
    hasPreharvestInterval: '',
};

const AddPesticide: React.FC<AddPesticideProps> = ({ onAction }) => {
    const [formData, setFormData] = useState<PesticideCreate>({ ...emptyForm });

    const { fetchData, response, error, loading } = useFetch<any>(
        'proxy/farmcalendar/api/v1/Pesticides/',
        { method: 'POST' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Pesticide added successfully');
            setFormData({ ...emptyForm });
            onAction && onAction();
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error adding pesticide');
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const fieldEmpty = (k: string) => !(formData as any)[k]?.toString().trim();
    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    const handlePost = () => {
        const body: any = {
            hasCommercialName: formData.hasCommercialName.trim(),
            description: formData.description.trim() || null,
            hasCost: formData.hasCost.trim(),
            isPricePer: formData.isPricePer.trim(),
            hasActiveSubstance: formData.hasActiveSubstance.trim(),
            isTargetedTowards: formData.isTargetedTowards.trim(),
            hasPreharvestInterval: parseInt(formData.hasPreharvestInterval, 10),
        };
        fetchData({ body });
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Stack direction={'column'} spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth margin="normal" label="Commercial name" name="hasCommercialName"
                        value={formData.hasCommercialName} onChange={handleChange}
                        required={isReq('hasCommercialName')} error={isReq('hasCommercialName') && fieldEmpty('hasCommercialName')} />
                    <TextField fullWidth margin="normal" label="Active substance" name="hasActiveSubstance"
                        value={formData.hasActiveSubstance} onChange={handleChange}
                        required={isReq('hasActiveSubstance')} error={isReq('hasActiveSubstance') && fieldEmpty('hasActiveSubstance')} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth margin="normal" label="Targeted towards" name="isTargetedTowards"
                        value={formData.isTargetedTowards} onChange={handleChange}
                        required={isReq('isTargetedTowards')} error={isReq('isTargetedTowards') && fieldEmpty('isTargetedTowards')} />
                    <TextField fullWidth margin="normal" label="Preharvest interval (days)" name="hasPreharvestInterval" type="number"
                        slotProps={{ htmlInput: { step: 1, min: 0 } }}
                        value={formData.hasPreharvestInterval} onChange={handleChange}
                        required={isReq('hasPreharvestInterval')} error={isReq('hasPreharvestInterval') && fieldEmpty('hasPreharvestInterval')} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth margin="normal" label="Cost" name="hasCost" type="number"
                        slotProps={{ htmlInput: { step: 0.01 } }}
                        value={formData.hasCost} onChange={handleChange}
                        required={isReq('hasCost')} error={isReq('hasCost') && fieldEmpty('hasCost')} />
                    <TextField fullWidth margin="normal" label="Price per (unit)" name="isPricePer"
                        value={formData.isPricePer} onChange={handleChange}
                        required={isReq('isPricePer')} error={isReq('isPricePer') && fieldEmpty('isPricePer')} />
                </Stack>
                <TextField fullWidth margin="normal" multiline rows={3} label="Description" name="description"
                    value={formData.description} onChange={handleChange} />
            </Stack>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" startIcon={<AddIcon />}
                    loading={loading} loadingPosition="start" disabled={isFormInvalid} onClick={handlePost}>
                    Add pesticide
                </Button>
            </Box>
            <GenericSnackbar type={snackbarState.type} message={snackbarState.message} open={snackbarState.open} onClose={closeSnackbar} />
        </Box>
    );
};

export default AddPesticide;
