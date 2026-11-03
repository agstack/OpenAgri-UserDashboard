import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmParcelModel } from "@models/FarmParcel";
import { AddFarmCropProps } from "./AddFarmCrop.types";
import { useSession } from "@contexts/SessionContext";

interface CropChoice { value: number; display_name: string }
interface CropOptionsResponse {
    actions?: { POST?: { status?: { choices?: CropChoice[] } } };
}

const KC_MIN = 0;
const KC_MAX = 2;
const inKcRange = (v: number) => !Number.isNaN(v) && v > KC_MIN && v < KC_MAX;

interface CropCreate {
    name: string;
    variety: string;
    description: string;
    growth_stage: string;
    kc_init: number;
    kc_mid: number;
    kc_end: number;
}

const emptyForm: CropCreate = {
    name: '',
    variety: '',
    description: '',
    growth_stage: '',
    kc_init: NaN,
    kc_mid: NaN,
    kc_end: NaN,
};

const AddFarmCrop: React.FC<AddFarmCropProps> = ({ onAction }) => {
    const { session } = useSession();
    const preselectedParcelId = session?.farm_parcel?.["@id"].split(':').pop() ?? '';

    const [formData, setFormData] = useState<CropCreate>({ ...emptyForm });
    const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcelId);
    const [statusStr, setStatusStr] = useState<string>('1');

    const { fetchData, response, error, loading } = useFetch<any>(
        'proxy/farmcalendar/api/v1/FarmCrops/',
        { method: 'POST' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Crop added successfully');
            setFormData({ ...emptyForm });
            setSelectedParcel(preselectedParcelId);
            setStatusStr('1');
            onAction && onAction();
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error adding crop');
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isKc = name === 'kc_init' || name === 'kc_mid' || name === 'kc_end';
        setFormData(prev => ({
            ...prev,
            [name]: isKc ? (value === '' ? NaN : parseFloat(value)) : value,
        }));
    };

    const nameEmpty = !formData.name.trim();
    const varietyEmpty = !formData.variety.trim();
    const parcelEmpty = !selectedParcel;
    const kcInitInvalid = !inKcRange(formData.kc_init);
    const kcMidInvalid = !inKcRange(formData.kc_mid);
    const kcEndInvalid = !inKcRange(formData.kc_end);
    const isFormInvalid = nameEmpty || varietyEmpty || parcelEmpty || kcInitInvalid || kcMidInvalid || kcEndInvalid;

    const handlePost = () => {
        fetchData({
            body: {
                name: formData.name.trim(),
                description: formData.description.trim(),
                growth_stage: formData.growth_stage.trim(),
                status: parseInt(statusStr, 10),
                cropSpecies: { name: formData.name.trim(), variety: formData.variety.trim() },
                hasAgriParcel: { '@id': `urn:farmcalendar:Parcel:${selectedParcel}`, '@type': 'Parcel' },
                kc_init: String(formData.kc_init),
                kc_mid: String(formData.kc_mid),
                kc_end: String(formData.kc_end),
            }
        });
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Stack direction={'column'} spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        fullWidth margin="normal" label="Crop name" name="name" required
                        value={formData.name} onChange={handleChange}
                        error={nameEmpty}
                    />
                    <TextField
                        fullWidth margin="normal" label="Variety" name="variety" required
                        value={formData.variety} onChange={handleChange}
                        error={varietyEmpty}
                    />
                </Stack>
                <GenericSelect<FarmParcelModel>
                    endpoint='proxy/farmcalendar/api/v1/FarmParcels/?format=json'
                    label='Parcel'
                    selectedValue={selectedParcel}
                    setSelectedValue={setSelectedParcel}
                    getOptionLabel={item => `${item.identifier} (${item.category})`}
                    getOptionValue={item => item["@id"].split(':')[3]}
                    required
                    error={parcelEmpty}
                />
                <TextField
                    fullWidth margin="normal" label="Growth stage" name="growth_stage"
                    value={formData.growth_stage} onChange={handleChange}
                    helperText="e.g. BBCH 90"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        fullWidth margin="normal" label="Kc init (0 < x < 2)" name="kc_init" type="number" required
                        slotProps={{ htmlInput: { step: 0.01, min: 0, max: 2 } }}
                        value={Number.isNaN(formData.kc_init) ? '' : formData.kc_init}
                        onChange={handleChange}
                        error={kcInitInvalid}
                    />
                    <TextField
                        fullWidth margin="normal" label="Kc mid (0 < x < 2)" name="kc_mid" type="number" required
                        slotProps={{ htmlInput: { step: 0.01, min: 0, max: 2 } }}
                        value={Number.isNaN(formData.kc_mid) ? '' : formData.kc_mid}
                        onChange={handleChange}
                        error={kcMidInvalid}
                    />
                    <TextField
                        fullWidth margin="normal" label="Kc end (0 < x < 2)" name="kc_end" type="number" required
                        slotProps={{ htmlInput: { step: 0.01, min: 0, max: 2 } }}
                        value={Number.isNaN(formData.kc_end) ? '' : formData.kc_end}
                        onChange={handleChange}
                        error={kcEndInvalid}
                    />
                </Stack>
                <GenericSelect<CropChoice, CropOptionsResponse>
                    endpoint='proxy/farmcalendar/api/v1/FarmCrops/?format=json'
                    method="OPTIONS"
                    label='Status'
                    selectedValue={statusStr}
                    setSelectedValue={setStatusStr}
                    transformResponse={r => r.actions?.POST?.status?.choices ?? []}
                    getOptionLabel={item => item.display_name}
                    getOptionValue={item => String(item.value)}
                />
                <TextField
                    fullWidth margin="normal" multiline rows={3}
                    label="Description" name="description"
                    value={formData.description} onChange={handleChange}
                />
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
                    Add crop
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

export default AddFarmCrop;
