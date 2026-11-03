import { useEffect, useState } from "react";
import { AddFarmProps } from "./AddFarm.types";
import { FarmModel } from "@models/Farm";
import { Box, Button, Stack, TextField } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";

const AddFarm: React.FC<AddFarmProps> = ({ onAction }) => {
    const [formData, setFormData] = useState<FarmModel | undefined>({
        '@type': '',
        '@id': '',
        status: 0,
        deleted_at: null,
        created_at: '',
        updated_at: '',
        name: '',
        description: '',
        administrator: '',
        telephone: '',
        vatID: '',
        hasAgriParcel: [],
        contactPerson: {
            firstname: '',
            lastname: '',
            '@id': '',
            '@type': '',
        },
        address: {
            '@id': '',
            '@type': '',
            adminUnitL1: '',
            adminUnitL2: '',
            addressArea: '',
            municipality: '',
            community: '',
            locatorName: '',
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setFormData(prev => {
            const newState = JSON.parse(JSON.stringify(prev)) as FarmModel;

            let currentLevel: any = newState;
            try {
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel = currentLevel[keys[i]];
                }
                const finalKey = keys[keys.length - 1];
                const isNumeric = typeof currentLevel[finalKey] === 'number';
                currentLevel[finalKey] = isNumeric ? parseFloat(value) || 0 : value;

            } catch (error) {
                console.error(`Error setting nested property "${name}":`, error);
                return prev;
            }
            return newState;
        });
    };

    const { fetchData, response, error, loading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Farm/`,
        {
            method: 'POST',
            body: formData
        }
    );

    const handlePost = () => {
        console.log("Form Data:", formData);
        fetchData();
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();


    useEffect(() => {
        if (response) {
            onAction && onAction();
            showSnackbar('success', "Pest added successfully");
        }
    }, [response]);

    useEffect(() => {
        if (error) {
            showSnackbar('error', "An error occurred");
        }
    }, [error]);

    const isFormInvalid =
        !formData?.name?.trim() ||
        !formData.description?.trim() ||
        !formData.administrator?.trim() ||
        !formData.contactPerson.firstname?.trim() ||
        !formData.contactPerson.lastname?.trim() ||
        !formData.telephone?.trim() ||
        !formData.vatID?.trim() ||
        !formData.address.adminUnitL1?.trim() ||
        !formData.address.adminUnitL2?.trim() ||
        !formData.address.addressArea?.trim() ||
        !formData.address.municipality?.trim() ||
        !formData.address.community?.trim() ||
        !formData.address.locatorName?.trim();

    return (
        <>
            <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Stack direction={'column'} spacing={2} >
                    <TextField fullWidth margin="normal" label="Farm name" name="name" value={formData?.name ?? ''} onChange={handleChange} error={!formData?.name?.trim()} />
                    <TextField
                        fullWidth margin="normal" multiline rows={4} label="Description" name="description"
                        value={formData?.description ?? ''} onChange={handleChange}
                    />
                    <TextField fullWidth margin="normal" label="Farm administrator" name="administrator" value={formData?.administrator ?? ''}
                        onChange={handleChange} error={!formData?.administrator?.trim()} />
                    <TextField fullWidth margin="normal" label="Contact person first name" name="contactPerson.firstname" value={formData?.contactPerson.firstname ?? ''}
                        onChange={handleChange} error={!formData?.contactPerson.firstname?.trim()} />
                    <TextField fullWidth margin="normal" label="Contact person last name" name="contactPerson.lastname" value={formData?.contactPerson.lastname ?? ''}
                        onChange={handleChange} error={!formData?.contactPerson.lastname?.trim()} />
                    <TextField fullWidth margin="normal" label="Contact telephone" name="telephone" value={formData?.telephone ?? ''}
                        onChange={handleChange} error={!formData?.telephone?.trim()} />
                    <TextField fullWidth margin="normal" label="VAT ID" name="vatID" value={formData?.vatID ?? ''}
                        onChange={handleChange} error={!formData?.vatID?.trim()} />
                    <TextField fullWidth margin="normal" label="Admin unit line 1" name="address.adminUnitL1" value={formData?.address.adminUnitL1 ?? ''}
                        onChange={handleChange} error={!formData?.address.adminUnitL1?.trim()} />
                    <TextField fullWidth margin="normal" label="Admin unit line 2" name="address.adminUnitL2" value={formData?.address.adminUnitL2 ?? ''}
                        onChange={handleChange} error={!formData?.address.adminUnitL2?.trim()} />
                    <TextField fullWidth margin="normal" label="Address area" name="address.addressArea" value={formData?.address.addressArea ?? ''}
                        onChange={handleChange} error={!formData?.address.addressArea?.trim()} />
                    <TextField fullWidth margin="normal" label="Municipality" name="address.municipality" value={formData?.address.municipality ?? ''}
                        onChange={handleChange} error={!formData?.address.municipality?.trim()} />
                    <TextField fullWidth margin="normal" label="Community" name="address.community" value={formData?.address.community ?? ''}
                        onChange={handleChange} error={!formData?.address.community?.trim()} />
                    <TextField fullWidth margin="normal" label="Locator name" name="address.locatorName" value={formData?.address.locatorName ?? ''}
                        onChange={handleChange} error={!formData?.address.locatorName?.trim()} />
                </Stack>
            </Box>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    loading={loading}
                    loadingPosition="start"
                    disabled={isFormInvalid}
                    onClick={handlePost}
                >
                    Add farm
                </Button>
            </Box>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default AddFarm;