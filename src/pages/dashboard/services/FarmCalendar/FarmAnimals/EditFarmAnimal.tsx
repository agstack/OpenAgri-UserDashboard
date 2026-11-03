import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmAnimalModel } from "@models/FarmAnimalModel";
import { FarmParcelModel } from "@models/FarmParcel";
import { Box, Button, Card, CardContent, FormControlLabel, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

interface AnimalChoice { value: number; display_name: string }
interface AnimalOptionsResponse {
    actions?: { POST?: { sex?: { choices?: AnimalChoice[] }; status?: { choices?: AnimalChoice[] } } };
}

const EditFarmAnimalPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');

    const { id } = useParams();
    const animalId = id ?? '';

    const [formData, setFormData] = useState<FarmAnimalModel | undefined>();
    const [birthdate, setBirthdate] = useState<Dayjs | null>(null);
    const [selectedParcel, setSelectedParcel] = useState<string>('');
    const [sexStr, setSexStr] = useState<string>('0');
    const [statusStr, setStatusStr] = useState<string>('1');
    const [animalGroupName, setAnimalGroupName] = useState<string>('');

    const { fetchData, loading, response, error } = useFetch<FarmAnimalModel>(
        `proxy/farmcalendar/api/v1/FarmAnimals/${animalId}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmAnimals/${animalId}/`,
        { method: 'PATCH' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading animal');
    }, [error]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error saving animal');
    }, [patchError]);

    useEffect(() => {
        if (response) {
            setFormData(response);
            setBirthdate(response.birthdate ? dayjs(response.birthdate) : null);
            setSexStr(String(response.sex ?? 0));
            setStatusStr(String(response.status ?? 1));
            const parcelId = response.hasAgriParcel?.["@id"]?.split(':').pop() ?? '';
            setSelectedParcel(parcelId);
            setAnimalGroupName(response.isMemberOfAnimalGroup?.hasName ?? '');
        }
    }, [response]);

    useEffect(() => {
        if (patchResponse) navigate('/farm-animals');
    }, [patchResponse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : undefined);
    };

    const speciesEmpty = !formData?.species?.trim();
    const parcelEmpty = !selectedParcel;
    const birthdateInvalid = !birthdate || !birthdate.isValid();
    const isFormInvalid = speciesEmpty || parcelEmpty || birthdateInvalid;

    const handleSave = () => {
        if (!formData) return;
        const body: any = {
            nationalID: (formData.nationalID ?? '').trim(),
            name: (formData.name ?? '').trim(),
            description: (formData.description ?? '').trim(),
            species: formData.species.trim(),
            breed: (formData.breed ?? '').trim(),
            sex: parseInt(sexStr, 10),
            isCastrated: formData.isCastrated,
            status: parseInt(statusStr, 10),
            birthdate: birthdate!.toISOString(),
            hasAgriParcel: { '@id': `urn:farmcalendar:Parcel:${selectedParcel}`, '@type': 'Parcel' },
        };
        if (animalGroupName.trim()) {
            body.isMemberOfAnimalGroup = { '@type': 'AnimalGroup', hasName: animalGroupName.trim() };
        } else {
            body.isMemberOfAnimalGroup = null;
        }
        patchFetchData({ body });
    };

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && formData && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{formData.name || formData.nationalID || formData.species}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Name" name="name" value={formData.name ?? ''} onChange={handleChange} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="National ID" name="nationalID" value={formData.nationalID ?? ''} onChange={handleChange} />
                                </Stack>
                                <TextField
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" label="Species" name="species" required
                                    value={formData.species ?? ''} onChange={handleChange}
                                    error={speciesEmpty}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Breed" name="breed" value={formData.breed ?? ''} onChange={handleChange} />
                                    <DateTimePicker
                                        readOnly={!canEdit}
                                        label="Birthdate"
                                        value={birthdate}
                                        onChange={setBirthdate}
                                        slotProps={{ textField: { fullWidth: true, required: true, error: birthdateInvalid, margin: 'normal' } }}
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
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <GenericSelect<AnimalChoice, AnimalOptionsResponse>
                                        canEdit={canEdit}
                                        endpoint='proxy/farmcalendar/api/v1/FarmAnimals/?format=json'
                                        method="OPTIONS"
                                        label='Sex'
                                        selectedValue={sexStr}
                                        setSelectedValue={setSexStr}
                                        transformResponse={r => r.actions?.POST?.sex?.choices ?? []}
                                        getOptionLabel={item => item.display_name}
                                        getOptionValue={item => String(item.value)}
                                    />
                                    <GenericSelect<AnimalChoice, AnimalOptionsResponse>
                                        canEdit={canEdit}
                                        endpoint='proxy/farmcalendar/api/v1/FarmAnimals/?format=json'
                                        method="OPTIONS"
                                        label='Status'
                                        selectedValue={statusStr}
                                        setSelectedValue={setStatusStr}
                                        transformResponse={r => r.actions?.POST?.status?.choices ?? []}
                                        getOptionLabel={item => item.display_name}
                                        getOptionValue={item => String(item.value)}
                                    />
                                </Stack>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!formData.isCastrated}
                                            disabled={!canEdit}
                                            onChange={(e) => setFormData(prev => prev ? { ...prev, isCastrated: e.target.checked } : undefined)}
                                        />
                                    }
                                    label="Castrated"
                                />
                                <TextField
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" label="Animal group name"
                                    value={animalGroupName}
                                    onChange={(e) => setAnimalGroupName(e.target.value)}
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

export default EditFarmAnimalPage;
