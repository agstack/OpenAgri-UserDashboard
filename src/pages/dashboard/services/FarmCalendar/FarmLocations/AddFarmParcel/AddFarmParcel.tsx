import { Box, Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { AddFarmParcelProps } from "./AddFarmParcel.types";
import { useEffect, useState } from "react";
import { FarmParcelModel } from "@models/FarmParcel";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmModel } from "@models/Farm";
import AddIcon from '@mui/icons-material/Add';
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import WKTPolygonMap from "@components/shared/WKTPolygonMap/WKTPolygonMap";
import { wktFirstLatLong } from "@utils/wktPolygon";

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

const AddFarmParcel: React.FC<AddFarmParcelProps> = ({ onAction }) => {

    const [selectedFarm, setSelectedFarm] = useState<string>('');

    const [formData, setFormData] = useState<FarmParcelModel | undefined>({
        '@type': '',
        '@id': '',
        'status': 0,
        'deleted_at': null,
        'created_at': '',
        'updated_at': '',
        'identifier': '',
        'description': '',
        'validFrom': new Date().toISOString(),
        'validTo': new Date().toISOString(),
        'area': '',
        'hasIrrigationFlow': '',
        'category': '',
        'inRegion': '',
        'hasToponym': '',
        'isNitroArea': false,
        'isNatura2000Area': false,
        'isPdopgArea': false,
        'isIrrigated': false,
        'isCultivatedInLevels': false,
        'isGroundSlope': false,
        'depiction': null,
        'hasGeometry': {
            '@id': '',
            '@type': '',
            'asWKT': ''
        },
        'location': {
            '@id': '',
            '@type': '',
            'lat': null,
            'long': null
        },
        'hasAgriCrop': [],
        'farm': {
            '@type': 'Farm',
            '@id': '',
        }
    });

    const { fetchData, response, error, loading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmParcels/`,
        {
            method: 'POST'
        }
    );

    const handlePost = () => {
        const body = JSON.parse(JSON.stringify(formData)) as FarmParcelModel;
        (body.farm as { '@id': string })['@id'] = `urn:farmcalendar:Farm:${selectedFarm}`;

        if (typeof body.depiction === 'string' && !body.depiction.trim()) body.depiction = null;

        fetchData({ body });
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        if (response) {
            onAction && onAction();
            showSnackbar('success', "Farm parcel added successfully");
        }
    }, [response]);

    useEffect(() => {
        if (error) {
            showSnackbar('error', "An error occurred");
        }
    }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const keys = name.split('.');

        const isNumericField =
            name === 'area' ||
            name === 'hasIrrigationFlow' ||
            name === 'location.lat' ||
            name === "location.long";

        setFormData(prev => {
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
        setFormData(prev => {
            if (!prev) return undefined;
            return { ...prev, [fieldName]: val ? val.toISOString() : '' } as FarmParcelModel;
        });
    };

    const handleGeometryChange = (wkt: string) => {
        const coord = wktFirstLatLong(wkt);
        setFormData(prev => {
            if (!prev) return undefined;
            return {
                ...prev,
                hasGeometry: { ...prev.hasGeometry, asWKT: wkt },
                location: coord ? { ...prev.location, lat: coord.lat, long: coord.long } : prev.location,
            };
        });
    };

    const fieldEmpty = (key: string): boolean => {
        if (!formData) return true;
        switch (key) {
            case 'identifier': return !formData.identifier?.trim();
            case 'category': return !formData.category?.trim();
            case 'farm': return !selectedFarm;
            case 'hasGeometry.asWKT': return !formData.hasGeometry?.asWKT;
            case 'location.lat': return formData.location.lat == null || Number.isNaN(formData.location.lat);
            case 'location.long': return formData.location.long == null || Number.isNaN(formData.location.long);
            case 'validFrom': return !formData.validFrom;
            case 'validTo': return !formData.validTo;
            case 'inRegion': return !formData.inRegion?.trim();
            case 'hasToponym': return !formData.hasToponym?.trim();
            case 'area': return formData.area == null || formData.area === '' || Number.isNaN(formData.area as any);
            default: return false;
        }
    };

    const isFormInvalid = Array.from(REQUIRED_KEYS).some(k => fieldEmpty(k));

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={2}>

                <Stack direction={'column'} spacing={2} >
                    {<GenericSelect<FarmModel>
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
                        <TextField fullWidth margin="normal" label="Parcel identifier" name="identifier" value={formData?.identifier ?? ''} onChange={handleChange} required={isReq('identifier')} error={isReq('identifier') && fieldEmpty('identifier')} />
                        <TextField fullWidth margin="normal" label="Parcel type" name="category" value={formData?.category ?? ''} onChange={handleChange} required={isReq('category')} error={isReq('category') && fieldEmpty('category')} />
                    </Stack>
                    <TextField fullWidth margin="normal" multiline rows={3} label="Parcel description" name="description" value={formData?.description ?? ''} onChange={handleChange} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <Box flex={1} width={'100%'}>
                            <DateTimePicker
                                label="Valid from"
                                value={formData?.validFrom ? dayjs(formData.validFrom) : null}
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
                                label="Valid to"
                                value={formData?.validTo ? dayjs(formData.validTo) : null}
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
                        <TextField fullWidth margin="normal" label="Region" name="inRegion" value={formData?.inRegion ?? ''} onChange={handleChange} required={isReq('inRegion')} error={isReq('inRegion') && fieldEmpty('inRegion')} />
                        <TextField fullWidth margin="normal" label="Toponym" name="hasToponym" value={formData?.hasToponym ?? ''} onChange={handleChange} required={isReq('hasToponym')} error={isReq('hasToponym') && fieldEmpty('hasToponym')} />
                    </Stack>
                    <Stack flexWrap={"wrap"} direction={'row'} spacing={3} alignItems="center">
                        <FormControlLabel control={<Checkbox name="isNitroArea" checked={!!formData?.isNitroArea} onChange={handleChange} />} label="Nitro area" />
                        <FormControlLabel control={<Checkbox name="isNatura2000Area" checked={!!formData?.isNatura2000Area} onChange={handleChange} />} label="Natura 2000 area" />
                        <FormControlLabel control={<Checkbox name="isPdopgArea" checked={!!formData?.isPdopgArea} onChange={handleChange} />} label="PDOPG area" />
                        <FormControlLabel control={<Checkbox name="isIrrigated" checked={!!formData?.isIrrigated} onChange={handleChange} />} label="Irrigated" />
                        <FormControlLabel control={<Checkbox name="isCultivatedInLevels" checked={!!formData?.isCultivatedInLevels} onChange={handleChange} />} label="Cultivated in levels" />
                        <FormControlLabel control={<Checkbox name="isGroundSlope" checked={!!formData?.isGroundSlope} onChange={handleChange} />} label="Ground slope" />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                        <TextField fullWidth margin="normal" label="Area (sq. meters)" name="area" value={formData?.area ?? ''} type="number" slotProps={{ htmlInput: { step: 0.01 } }} onChange={handleChange} required={isReq('area')} error={isReq('area') && fieldEmpty('area')} />
                        <TextField fullWidth margin="normal" label="Image URL (override)" name="depiction" value={formData?.depiction ?? ''} onChange={handleChange} helperText="If empty, the parcel boundary polygon is rendered as the thumbnail." />
                    </Stack>
                    <TextField fullWidth margin="normal" label="Irrigation flow (units)" name="hasIrrigationFlow" value={formData?.hasIrrigationFlow ?? ''} type="number" slotProps={{ htmlInput: { step: 0.01 } }} onChange={handleChange} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField fullWidth margin="normal" label="Latitude" name="location.lat" value={formData?.location.lat ?? ''} type="number" onChange={handleChange} required={isReq('location.lat')} error={isReq('location.lat') && fieldEmpty('location.lat')} />
                        <TextField fullWidth margin="normal" label="Longitude" name="location.long" value={formData?.location.long ?? ''} type="number" onChange={handleChange} required={isReq('location.long')} error={isReq('location.long') && fieldEmpty('location.long')} />
                    </Stack>
                    <Stack direction={'column'} spacing={1}>
                        <Typography variant="subtitle2" color={isReq('hasGeometry.asWKT') && fieldEmpty('hasGeometry.asWKT') ? 'error' : undefined}>
                            Parcel boundary{isReq('hasGeometry.asWKT') ? ' *' : ''}
                        </Typography>
                        <WKTPolygonMap
                            value={formData?.hasGeometry?.asWKT ?? ''}
                            onChange={handleGeometryChange}
                            center={formData?.location}
                        />
                    </Stack>
                </Stack>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        loading={loading}
                        loadingPosition="start"
                        disabled={isFormInvalid}
                        onClick={handlePost}
                    >
                        Save Changes
                    </Button>
                </Box>
                <GenericSnackbar
                    type={snackbarState.type}
                    message={snackbarState.message}
                    open={snackbarState.open}
                    onClose={closeSnackbar}
                />
            </Box>
        </>
    )
}

export default AddFarmParcel;
