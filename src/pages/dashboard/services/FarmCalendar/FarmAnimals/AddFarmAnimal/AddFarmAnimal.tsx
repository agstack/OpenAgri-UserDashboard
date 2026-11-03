import { Box, Button, FormControlLabel, Stack, Switch, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmParcelModel } from "@models/FarmParcel";
import { AddFarmAnimalProps } from "./AddFarmAnimal.types";
import { useSession } from "@contexts/SessionContext";

interface AnimalChoice { value: number; display_name: string }
interface AnimalOptionsResponse {
    actions?: { POST?: { sex?: { choices?: AnimalChoice[] }; status?: { choices?: AnimalChoice[] } } };
}

interface AnimalCreate {
    nationalID: string;
    name: string;
    description: string;
    species: string;
    breed: string;
    sex: number;
    isCastrated: boolean;
    status: number;
    animalGroupName: string;
}

const emptyForm: AnimalCreate = {
    nationalID: '',
    name: '',
    description: '',
    species: '',
    breed: '',
    sex: 0,
    isCastrated: false,
    status: 1,
    animalGroupName: '',
};

const AddFarmAnimal: React.FC<AddFarmAnimalProps> = ({ onAction }) => {
    const { session } = useSession();
    const preselectedParcelId = session?.farm_parcel?.["@id"].split(':').pop() ?? '';

    const [formData, setFormData] = useState<AnimalCreate>({ ...emptyForm });
    const [birthdate, setBirthdate] = useState<Dayjs | null>(dayjs());
    const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcelId);
    const [sexStr, setSexStr] = useState<string>('0');
    const [statusStr, setStatusStr] = useState<string>('1');

    const { fetchData, response, error, loading } = useFetch<any>(
        'proxy/farmcalendar/api/v1/FarmAnimals/',
        { method: 'POST' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            showSnackbar('success', 'Animal added successfully');
            setFormData({ ...emptyForm });
            setBirthdate(dayjs());
            setSelectedParcel(preselectedParcelId);
            setSexStr('0');
            setStatusStr('1');
            onAction && onAction();
        }
    }, [response]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error adding animal');
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const speciesEmpty = !formData.species.trim();
    const parcelEmpty = !selectedParcel;
    const birthdateInvalid = !birthdate || !birthdate.isValid();
    const isFormInvalid = speciesEmpty || parcelEmpty || birthdateInvalid;

    const handlePost = () => {
        const body: any = {
            nationalID: formData.nationalID.trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            species: formData.species.trim(),
            breed: formData.breed.trim(),
            sex: parseInt(sexStr, 10),
            isCastrated: formData.isCastrated,
            status: parseInt(statusStr, 10),
            birthdate: birthdate!.toISOString(),
            hasAgriParcel: { '@id': `urn:farmcalendar:Parcel:${selectedParcel}`, '@type': 'Parcel' },
        };
        if (formData.animalGroupName.trim()) {
            body.isMemberOfAnimalGroup = { '@type': 'AnimalGroup', hasName: formData.animalGroupName.trim() };
        }
        fetchData({ body });
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Stack direction={'column'} spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth margin="normal" label="Name" name="name" value={formData.name} onChange={handleChange} />
                    <TextField fullWidth margin="normal" label="National ID" name="nationalID" value={formData.nationalID} onChange={handleChange} />
                </Stack>
                <TextField
                    fullWidth margin="normal" label="Species" name="species" required
                    value={formData.species} onChange={handleChange}
                    error={speciesEmpty}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth margin="normal" label="Breed" name="breed" value={formData.breed} onChange={handleChange} />
                    <DateTimePicker
                        label="Birthdate"
                        value={birthdate}
                        onChange={setBirthdate}
                        slotProps={{ textField: { fullWidth: true, required: true, error: birthdateInvalid, margin: 'normal' } }}
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
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <GenericSelect<AnimalChoice, AnimalOptionsResponse>
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
                            checked={formData.isCastrated}
                            onChange={(e) => setFormData(prev => ({ ...prev, isCastrated: e.target.checked }))}
                        />
                    }
                    label="Castrated"
                />
                <TextField fullWidth margin="normal" label="Animal group name" name="animalGroupName" value={formData.animalGroupName} onChange={handleChange} />
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
                    Add animal
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

export default AddFarmAnimal;
