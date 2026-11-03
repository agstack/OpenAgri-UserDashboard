import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmModel } from "@models/Farm";
import { FarmParcelModel } from "@models/FarmParcel";
import { Box, Button, Card, CardActionArea, CardContent, Chip, Grid, Skeleton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PolylineIcon from '@mui/icons-material/Polyline';
import useDialog from "@hooks/useDialog";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import ParcelThumbnail from "@components/shared/ParcelThumbnail/ParcelThumbnail";

const FarmPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [farm, setFarm] = useState<FarmModel>();
    const [title, setTitle] = useState<string>('');

    const { id } = useParams();
    const { fetchData, loading, response, error } = useFetch<FarmModel>(
        `proxy/farmcalendar/api/v1/Farm/${id}/?format=json`,
        {
            method: 'GET',
        }
    );

    const { fetchData: editFetchData, response: editResponse, error: editError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Farm/${id}/?format=json`,
        {
            method: 'PATCH',
        }
    );

    const { fetchData: deleteFetchData, error: deleteError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/Farm/${id}/?format=json`,
        {
            method: 'DELETE',
        }
    );

    const { fetchData: fetchParcels, response: parcelsResponse, loading: parcelsLoading, error: parcelsError } = useFetch<FarmParcelModel[]>(
        `proxy/farmcalendar/api/v1/FarmParcels/?format=json`,
        { method: 'GET' },
    );

    const { dialogProps, showDialog } = useDialog();

    const handleCloseDialog = () => {
        dialogProps.onClose();
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
        fetchParcels();
    }, [])

    useEffect(() => {
        if (parcelsError) {
            showSnackbar('error', 'Error loading parcels');
        }
    }, [parcelsError])

    const farmParcels = useMemo(() => {
        if (!Array.isArray(parcelsResponse) || !farm) return [];
        return parcelsResponse.filter(p => p.farm?.["@id"] === farm["@id"]);
    }, [parcelsResponse, farm])

    useEffect(() => {
        if (error) {
            showSnackbar('error', 'Error loading farm');
        }
    }, [error])

    useEffect(() => {
        if (editError) {
            showSnackbar('error', 'Error editing farm');
        }
    }, [editError])

    useEffect(() => {
        if (deleteError) {
            showSnackbar('error', 'Error deleting farm');
        }
    }, [deleteError])

    useEffect(() => {
        if (response) {
            setFarm(response);
            setTitle(response.name);
        }
    }, [response])

    const navigate = useNavigate();
    useEffect(() => {
        if (editResponse) {
            navigate("/farm-locations/farms");
        }
    }, [editResponse])

    const handleDelete = async () => {
        await deleteFetchData();
        navigate("/farm-locations/farms");
    };

    const handleEdit = () => {
        editFetchData({
            body: farm
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setFarm(prev => {
            if (!prev) return undefined;

            const newState = JSON.parse(JSON.stringify(prev)) as FarmModel;
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }
            currentLevel[keys[keys.length - 1]] = value;

            return newState;
        });
    };


    const isFormInvalid =
        !farm?.name?.trim() ||
        !farm.administrator?.trim() ||
        !farm.description?.trim() ||
        !farm.contactPerson?.firstname?.trim() ||
        !farm.contactPerson?.lastname?.trim() ||
        !farm.telephone?.trim() ||
        !farm.vatID?.trim() ||
        !farm.address?.adminUnitL1?.trim() ||
        !farm.address?.adminUnitL2?.trim() ||
        !farm.address?.addressArea?.trim() ||
        !farm.address?.municipality?.trim() ||
        !farm.address?.community?.trim() ||
        !farm.address?.locatorName?.trim();

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {
                !loading && !error &&
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>Edit {title}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2} >
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Farm name" name="name" value={farm?.name ?? ''} onChange={handleChange} error={!farm?.name?.trim()} />
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="administrator" name="administrator" value={farm?.administrator ?? ''} onChange={handleChange} error={!farm?.administrator?.trim()} />
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" multiline rows={3} label="Farm description" name="description" value={farm?.description ?? ''} onChange={handleChange} error={!farm?.description?.trim()} />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Contact person first name" name="contactPerson.firstname" value={farm?.contactPerson.firstname ?? ''} onChange={handleChange} error={!farm?.contactPerson.firstname?.trim()} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Contact person last name" name="contactPerson.lastname" value={farm?.contactPerson.lastname ?? ''} onChange={handleChange} error={!farm?.contactPerson.lastname?.trim()} />
                                </Stack>
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Contact telephone" name="telephone" value={farm?.telephone ?? ''} onChange={handleChange} error={!farm?.telephone?.trim()} />
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="VAT ID" name="vatID" value={farm?.vatID ?? ''} onChange={handleChange} error={!farm?.vatID?.trim()} />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Region" name="address.adminUnitL1" value={farm?.address.adminUnitL1 ?? ''} onChange={handleChange} error={!farm?.address.adminUnitL1?.trim()} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Subregion" name="address.adminUnitL2" value={farm?.address.adminUnitL2 ?? ''} onChange={handleChange} error={!farm?.address.adminUnitL2?.trim()} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Address area" name="address.addressArea" value={farm?.address.addressArea ?? ''} onChange={handleChange} error={!farm?.address.addressArea?.trim()} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Municipality" name="address.municipality" value={farm?.address.municipality ?? ''} onChange={handleChange} error={!farm?.address.municipality?.trim()} />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Community" name="address.community" value={farm?.address.community ?? ''} onChange={handleChange} error={!farm?.address.community?.trim()} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Locator name" name="address.locatorName" value={farm?.address.locatorName ?? ''} onChange={handleChange} error={!farm?.address.locatorName?.trim()} />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            loading={loading}
                            loadingPosition="start"
                            disabled={isFormInvalid || !canEdit}
                            onClick={handleEdit}
                        >
                            Save Changes
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            loading={loading}
                            loadingPosition="start"
                            disabled={!canDelete}
                            onClick={() => {
                                showDialog({
                                    title: `Are you sure you want to delete this farm?`,
                                    variant: 'yes-no',
                                    children: <></>
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h5" gutterBottom>
                            Parcels ({farmParcels.length})
                        </Typography>
                        {parcelsLoading && (
                            <Grid container spacing={2}>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                                        <Skeleton variant="rectangular" height={160} />
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                        {!parcelsLoading && farmParcels.length === 0 && (
                            <Typography color="text.secondary">No parcels assigned to this farm.</Typography>
                        )}
                        {!parcelsLoading && farmParcels.length > 0 && (
                            <Grid container spacing={2}>
                                {farmParcels.map(p => {
                                    const parcelId = p["@id"].split(':').pop() ?? '';
                                    const hasPolygon = !!p.hasGeometry?.asWKT?.trim();
                                    const depictionUrl = (p.depiction || '').trim();
                                    return (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p["@id"]}>
                                            <Card variant="outlined" sx={{ height: '100%' }}>
                                                <CardActionArea
                                                    onClick={() => navigate(`/farm-locations/farm-parcel/${parcelId}`)}
                                                    sx={{ height: '100%' }}
                                                >
                                                    <CardContent>
                                                        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                                            <ParcelThumbnail
                                                                depictionUrl={depictionUrl}
                                                                wkt={p.hasGeometry?.asWKT}
                                                                identifier={p.identifier}
                                                                size={64}
                                                            />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                                                    <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                                                                        {p.identifier || 'Unnamed parcel'}
                                                                    </Typography>
                                                                    {hasPolygon && (
                                                                        <Tooltip title="Has polygon">
                                                                            <PolylineIcon fontSize="small" color="primary" />
                                                                        </Tooltip>
                                                                    )}
                                                                </Stack>
                                                            </Box>
                                                        </Stack>
                                                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                                                            {p.category && <Chip size="small" label={p.category} />}
                                                            {p.area && <Chip size="small" variant="outlined" label={`${p.area} m2`} />}
                                                        </Stack>
                                                        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                                                            {p.inRegion && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Region: {p.inRegion}
                                                                </Typography>
                                                            )}
                                                            {p.hasToponym && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Toponym: {p.hasToponym}
                                                                </Typography>
                                                            )}
                                                            {p.description && (
                                                                <Typography variant="body2" color="text.secondary" sx={{
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                                                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                                }}>
                                                                    {p.description}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </Box>
                </Box>
            }
            <GenericDialog {...dialogProps} onClose={handleCloseDialog} onYes={handleDelete} />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    )
}

export default FarmPage;