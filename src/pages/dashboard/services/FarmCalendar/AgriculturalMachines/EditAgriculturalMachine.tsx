import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { AgriculturalMachine } from "@models/AgriculturalMachine";
import { FarmParcelModel } from "@models/FarmParcel";
import { Box, Button, Card, CardContent, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

interface MachineChoice { value: number; display_name: string }
interface MachineOptionsResponse {
    actions?: { POST?: { status?: { choices?: MachineChoice[] } } };
}

const EditAgriculturalMachinePage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');

    const { id } = useParams();
    const machineId = id ?? '';

    const [formData, setFormData] = useState<AgriculturalMachine | undefined>();
    const [purchaseDate, setPurchaseDate] = useState<Dayjs | null>(null);
    const [selectedParcel, setSelectedParcel] = useState<string>('');
    const [statusStr, setStatusStr] = useState<string>('1');

    const { fetchData, loading, response, error } = useFetch<AgriculturalMachine>(
        `proxy/farmcalendar/api/v1/AgriculturalMachines/${machineId}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/AgriculturalMachines/${machineId}/`,
        { method: 'PATCH' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading machine');
    }, [error]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error saving machine');
    }, [patchError]);

    useEffect(() => {
        if (response) {
            setFormData(response);
            setPurchaseDate(response.purchase_date ? dayjs(response.purchase_date) : null);
            setStatusStr(String(response.status ?? 1));
            const parcelId = response.hasAgriParcel?.["@id"]?.split(':').pop() ?? '';
            setSelectedParcel(parcelId);
        }
    }, [response]);

    useEffect(() => {
        if (patchResponse) navigate('/agricultural-machines');
    }, [patchResponse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : undefined);
    };

    const nameEmpty = !formData?.name?.trim();
    const parcelEmpty = !selectedParcel;
    const dateInvalid = !purchaseDate || !purchaseDate.isValid();
    const manufacturerEmpty = !formData?.manufacturer?.trim();
    const modelEmpty = !formData?.model?.trim();
    const serialEmpty = !formData?.seria_number?.trim();
    const isFormInvalid = nameEmpty || parcelEmpty || dateInvalid || manufacturerEmpty || modelEmpty || serialEmpty;

    const handleSave = () => {
        if (!formData) return;
        patchFetchData({
            body: {
                name: formData.name.trim(),
                description: (formData.description ?? '').trim(),
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
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && formData && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{formData.name}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <TextField
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" label="Name" name="name" required
                                    value={formData.name ?? ''} onChange={handleChange}
                                    error={nameEmpty}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        fullWidth margin="normal" label="Manufacturer" name="manufacturer" required
                                        value={formData.manufacturer ?? ''} onChange={handleChange}
                                        error={manufacturerEmpty}
                                    />
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        fullWidth margin="normal" label="Model" name="model" required
                                        value={formData.model ?? ''} onChange={handleChange}
                                        error={modelEmpty}
                                    />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        fullWidth margin="normal" label="Serial number" name="seria_number" required
                                        value={formData.seria_number ?? ''} onChange={handleChange}
                                        error={serialEmpty}
                                    />
                                    <DatePicker
                                        readOnly={!canEdit}
                                        label="Purchase date"
                                        value={purchaseDate}
                                        onChange={setPurchaseDate}
                                        slotProps={{ textField: { fullWidth: true, required: true, error: dateInvalid, margin: 'normal' } }}
                                    />
                                </Stack>
                                <GenericSelect<FarmParcelModel>
                                    canEdit={canEdit}
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
                                    canEdit={canEdit}
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
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" multiline rows={3}
                                    label="Description" name="description"
                                    value={formData.description ?? ''} onChange={handleChange}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained" color="primary"
                            startIcon={<SaveIcon />}
                            loading={patchLoading}
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

export default EditAgriculturalMachinePage;
