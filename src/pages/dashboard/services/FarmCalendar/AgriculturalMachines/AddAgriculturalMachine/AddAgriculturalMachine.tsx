import { Box, Button, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmParcelModel } from "@models/FarmParcel";
import { AddAgriculturalMachineProps } from "./AddAgriculturalMachine.types";
import { useSession } from "@contexts/SessionContext";

interface MachineChoice { value: number; display_name: string }
interface MachineOptionsResponse {
    actions?: { POST?: { status?: { choices?: MachineChoice[] } } };
}

interface MachineCreate {
    name: string;
    description: string;
    manufacturer: string;
    model: string;
    seria_number: string;
}

const emptyForm: MachineCreate = {
    name: '',
    description: '',
    manufacturer: '',
    model: '',
    seria_number: '',
};

const AddAgriculturalMachine: React.FC<AddAgriculturalMachineProps> = ({ onAction }) => {
    const { session } = useSession();
    const preselectedParcelId = session?.farm_parcel?.["@id"].split(':').pop() ?? '';

    const [formData, setFormData] = useState<MachineCreate>({ ...emptyForm });
    const [purchaseDate, setPurchaseDate] = useState<Dayjs | null>(dayjs());
    const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcelId);
    const [statusStr, setStatusStr] = useState<string>('1');

    const { fetchData, response, error, loading } = useFetch<any>(
        'proxy/farmcalendar/api/v1/AgriculturalMachines/',
        { method: 'POST' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Machine added successfully');
            setFormData({ ...emptyForm });
            setPurchaseDate(dayjs());
            setSelectedParcel(preselectedParcelId);
            setStatusStr('1');
            onAction && onAction();
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error adding machine');
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nameEmpty = !formData.name.trim();
    const parcelEmpty = !selectedParcel;
    const dateInvalid = !purchaseDate || !purchaseDate.isValid();
    const manufacturerEmpty = !formData.manufacturer.trim();
    const modelEmpty = !formData.model.trim();
    const serialEmpty = !formData.seria_number.trim();
    const isFormInvalid = nameEmpty || parcelEmpty || dateInvalid || manufacturerEmpty || modelEmpty || serialEmpty;

    const handlePost = () => {
        fetchData({
            body: {
                name: formData.name.trim(),
                description: formData.description.trim(),
                manufacturer: formData.manufacturer.trim(),
                model: formData.model.trim(),
                seria_number: formData.seria_number.trim(),
                status: parseInt(statusStr, 10),
                purchase_date: purchaseDate!.format('YYYY-MM-DD'),
                hasAgriParcel: { '@id': `urn:farmcalendar:Parcel:${selectedParcel}`, '@type': 'Parcel' },
            }
        });
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Stack direction={'column'} spacing={2}>
                <TextField
                    fullWidth margin="normal" label="Name" name="name" required
                    value={formData.name} onChange={handleChange}
                    error={nameEmpty}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        fullWidth margin="normal" label="Manufacturer" name="manufacturer" required
                        value={formData.manufacturer} onChange={handleChange}
                        error={manufacturerEmpty}
                    />
                    <TextField
                        fullWidth margin="normal" label="Model" name="model" required
                        value={formData.model} onChange={handleChange}
                        error={modelEmpty}
                    />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        fullWidth margin="normal" label="Serial number" name="seria_number" required
                        value={formData.seria_number} onChange={handleChange}
                        error={serialEmpty}
                    />
                    <DatePicker
                        label="Purchase date"
                        value={purchaseDate}
                        onChange={setPurchaseDate}
                        slotProps={{ textField: { fullWidth: true, required: true, error: dateInvalid, margin: 'normal' } }}
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
                <GenericSelect<MachineChoice, MachineOptionsResponse>
                    endpoint='proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json'
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
                    Add machine
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

export default AddAgriculturalMachine;
