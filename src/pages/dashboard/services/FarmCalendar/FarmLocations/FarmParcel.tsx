import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmModel } from "@models/Farm";
import { FarmParcelModel } from "@models/FarmParcel";
import { Box, Button, Card, CardContent, Checkbox, FormControlLabel, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import useDialog from "@hooks/useDialog";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import WKTPolygonMap from "@components/shared/WKTPolygonMap/WKTPolygonMap";
import { wktFirstLatLong } from "@utils/wktPolygon";
import { useSession } from "@contexts/SessionContext";
import { generateFieldNotebook } from "@utils/generateReport";

const REQUIRED_KEYS = new Set<string>([
    'identifier',
    'category',
    'farm',
    'hasGeometry.asWKT',
    'location.lat',
    'location.long',
    'validFrom',
    'validTo',
    'inRegion',
    'hasToponym',
    'area',
]);

const isReq = (key: string) => REQUIRED_KEYS.has(key);

const FarmParcelPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const { session } = useSession();

    const [parcel, setParcel] = useState<FarmParcelModel>();
    const [title, setTitle] = useState<string>('');

    const [selectedFarm, setSelectedFarm] = useState<string>('');
    const [notebookLoading, setNotebookLoading] = useState<boolean>(false);

    const { id } = useParams();
    const { fetchData, loading, response, error } = useFetch<FarmParcelModel>(
        `proxy/farmcalendar/api/v1/FarmParcels/${id}/?format=json`,
        {
            method: 'GET',
        }
    );

    const { fetchData: editFetchData, response: editResponse, error: editError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmParcels/${id}/?format=json`,
        {
            method: 'PATCH',
        }
    );

    const { fetchData: deleteFetchData, error: deleteError } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmParcels/${id}/?format=json`,
        {
            method: 'DELETE',
        }
    );

    const { dialogProps, showDialog } = useDialog();

    const handleCloseDialog = () => {
        dialogProps.onClose();
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
    }, [])

    useEffect(() => {
        if (error) {
            showSnackbar('error', 'Error loading parcel');
        }
    }, [error])

    useEffect(() => {
        if (editError) {
            showSnackbar('error', 'Error editing parcel');
        }
    }, [editError])

    useEffect(() => {
        if (deleteError) {
            showSnackbar('error', 'Error deleting parcel');
        }
    }, [deleteError])

    useEffect(() => {
        if (response) {
            setParcel(response);
            setTitle(response.identifier);
            setSelectedFarm(response.farm["@id"].split(':')[3]);
        }
    }, [response])

    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = (location.state as { from?: string } | null)?.from || "/farm-locations/farm-parcels";

    useEffect(() => {
        if (editResponse) {
            navigate(returnTo);
        }
    }, [editResponse])

    const handleDelete = async () => {
        await deleteFetchData();
        navigate(returnTo);
    };

    const handleEdit = () => {
        if (!parcel) return;
        const body = JSON.parse(JSON.stringify(parcel)) as FarmParcelModel;
        if (typeof body.depiction === 'string' && !body.depiction.trim()) body.depiction = null;
        editFetchData({ body });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const keys = name.split('.');

        const isNumericField =
            name === 'area' ||
            name === 'hasIrrigationFlow' ||
            name === 'location.lat' ||
            name === "location.long";

        setParcel(prev => {
            if (!prev) return undefined;

            const newState = JSON.parse(JSON.stringify(prev)) as FarmParcelModel;
            let currentLevel: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                currentLevel = currentLevel[keys[i]];
            }

            let finalValue: string | number | boolean | null = type === 'checkbox' ? checked : value;
            if (isNumericField) {
                finalValue = value === '' ? null : parseFloat(value);
            }

            currentLevel[keys[keys.length - 1]] = finalValue;

            return newState;
        });
    };

    const handleValidDateChange = (fieldName: 'validFrom' | 'validTo') => (val: Dayjs | null) => {
        setParcel(prev => {
            if (!prev) return undefined;
            return { ...prev, [fieldName]: val ? val.toISOString() : '' } as FarmParcelModel;
        });
    };

    const handleGeometryChange = (wkt: string) => {
        const coord = wktFirstLatLong(wkt);
        setParcel(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                hasGeometry: { ...prev.hasGeometry, asWKT: wkt },
                location: coord ? { ...prev.location, lat: coord.lat, long: coord.long } : prev.location,
            };
        });
    };

    const fieldEmpty = (key: string): boolean => {
        if (!parcel) return true;
        switch (key) {
            case 'identifier': return !parcel.identifier?.trim();
            case 'category': return !parcel.category?.trim();
            case 'farm': return !selectedFarm;
            case 'hasGeometry.asWKT': return !parcel.hasGeometry?.asWKT;
            case 'location.lat': return parcel.location.lat == null || Number.isNaN(parcel.location.lat);
            case 'location.long': return parcel.location.long == null || Number.isNaN(parcel.location.long);
            case 'validFrom': return !parcel.validFrom;
            case 'validTo': return !parcel.validTo;
            case 'inRegion': return !parcel.inRegion?.trim();
            case 'hasToponym': return !parcel.hasToponym?.trim();
            case 'area': return parcel.area == null || parcel.area === '' || Number.isNaN(parcel.area as any);
            default: return false;
        }
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {
                !(loading || error) &&
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{title}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2} >
                                {parcel && <GenericSelect<FarmModel>
                                    canEdit={canEdit}
                                    endpoint='proxy/farmcalendar/api/v1/Farm/?format=json'
                                    label='Selected farm'
                                    required={isReq('farm')}
                                    error={isReq('farm') && fieldEmpty('farm')}
                                    selectedValue={selectedFarm}
                                    setSelectedValue={setSelectedFarm}
                                    getOptionLabel={item => `${item.name}`}
                                    getOptionValue={item => item["@id"].split(':')[3]}>
                                </GenericSelect>}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Parcel identifier" name="identifier" value={parcel?.identifier ?? ''} onChange={handleChange} required={isReq('identifier')} error={isReq('identifier') && fieldEmpty('identifier')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Parcel type" name="category" value={parcel?.category ?? ''} onChange={handleChange} required={isReq('category')} error={isReq('category') && fieldEmpty('category')} />
                                </Stack>
                                <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" multiline rows={3} label="Parcel description" name="description" value={parcel?.description ?? ''} onChange={handleChange} />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <Box flex={1} width={'100%'}>
                                        <DateTimePicker
                                            readOnly={!canEdit}
                                            label="Valid from"
                                            value={parcel?.validFrom ? dayjs(parcel.validFrom) : null}
                                            onChange={handleValidDateChange('validFrom')}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    margin: 'normal',
                                                    required: isReq('validFrom'),
                                                    error: isReq('validFrom') && fieldEmpty('validFrom'),
                                                },
                                            }}
                                        />
                                    </Box>
                                    <Box flex={1} width={'100%'}>
                                        <DateTimePicker
                                            readOnly={!canEdit}
                                            label="Valid to"
                                            value={parcel?.validTo ? dayjs(parcel.validTo) : null}
                                            onChange={handleValidDateChange('validTo')}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    margin: 'normal',
                                                    required: isReq('validTo'),
                                                    error: isReq('validTo') && fieldEmpty('validTo'),
                                                },
                                            }}
                                        />
                                    </Box>
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Region" name="inRegion" value={parcel?.inRegion ?? ''} onChange={handleChange} required={isReq('inRegion')} error={isReq('inRegion') && fieldEmpty('inRegion')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Toponym" name="hasToponym" value={parcel?.hasToponym ?? ''} onChange={handleChange} required={isReq('hasToponym')} error={isReq('hasToponym') && fieldEmpty('hasToponym')} />
                                </Stack>
                                <Stack flexWrap={"wrap"} direction={'row'} spacing={3} alignItems="center">
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isNitroArea" checked={!!parcel?.isNitroArea} onChange={canEdit ? handleChange : () => {}} />} label="Nitro area" />
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isNatura2000Area" checked={!!parcel?.isNatura2000Area} onChange={canEdit ? handleChange : () => {}} />} label="Natura 2000 area" />
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isPdopgArea" checked={!!parcel?.isPdopgArea} onChange={canEdit ? handleChange : () => {}} />} label="PDOPG area" />
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isIrrigated" checked={!!parcel?.isIrrigated} onChange={canEdit ? handleChange : () => {}} />} label="Irrigated" />
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isCultivatedInLevels" checked={!!parcel?.isCultivatedInLevels} onChange={canEdit ? handleChange : () => {}} />} label="Cultivated in levels" />
                                    <FormControlLabel control={<Checkbox disableRipple={!canEdit} name="isGroundSlope" checked={!!parcel?.isGroundSlope} onChange={canEdit ? handleChange : () => {}} />} label="Ground slope" />
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                                    <TextField slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01 } }} fullWidth margin="normal" label="Area (sq. meters)" name="area" value={parcel?.area ?? ''} type="number" onChange={handleChange} required={isReq('area')} error={isReq('area') && fieldEmpty('area')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Image URL (override)" name="depiction" value={parcel?.depiction ?? ''} onChange={handleChange} helperText="If empty, the parcel boundary polygon is rendered as the thumbnail." />
                                </Stack>
                                <TextField slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01 } }} fullWidth margin="normal" label="Irrigation flow (units)" name="hasIrrigationFlow" value={parcel?.hasIrrigationFlow ?? ''} type="number" onChange={handleChange} />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Latitude" name="location.lat" value={parcel?.location.lat ?? ''} type="number" onChange={handleChange} required={isReq('location.lat')} error={isReq('location.lat') && fieldEmpty('location.lat')} />
                                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Longitude" name="location.long" value={parcel?.location.long ?? ''} type="number" onChange={handleChange} required={isReq('location.long')} error={isReq('location.long') && fieldEmpty('location.long')} />
                                </Stack>
                                <TextField disabled slotProps={{ input: { readOnly: true } }} fullWidth margin="normal" label="Geo ID" value={parcel?.hasGeometry?.['@id']?.split('urn:farmcalendar:Geometry:')[1] ?? ''} />
                                <Stack direction={'column'} spacing={1}>
                                    <Typography variant="subtitle2" color={isReq('hasGeometry.asWKT') && fieldEmpty('hasGeometry.asWKT') ? 'error' : undefined}>
                                        Parcel boundary{isReq('hasGeometry.asWKT') ? ' *' : ''}
                                    </Typography>
                                    <WKTPolygonMap
                                        value={parcel?.hasGeometry?.asWKT ?? ''}
                                        onChange={handleGeometryChange}
                                        readOnly={!canEdit}
                                        center={parcel?.location}
                                    />
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
                                    title: `Are you sure you want to delete this parcel?`,
                                    variant: 'yes-no',
                                    children: <></>
                                });
                            }}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<InsertDriveFileIcon />}
                            loading={notebookLoading}
                            loadingPosition="start"
                            disabled={!id || !session?.user?.token}
                            onClick={async () => {
                                if (!session?.user?.token || !id) return;
                                setNotebookLoading(true);
                                try {
                                    await generateFieldNotebook(session.user.token, { parcel_id: id }, null);
                                } catch (e: any) {
                                    showSnackbar('error', e?.message ?? 'Error generating field notebook');
                                } finally {
                                    setNotebookLoading(false);
                                }
                            }}
                        >
                            Download field notebook
                        </Button>
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

export default FarmParcelPage;