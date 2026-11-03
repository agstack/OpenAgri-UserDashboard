import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmCropModel } from "@models/FarmCrop";
import { FarmParcelModel } from "@models/FarmParcel";
import { Box, Button, Card, CardContent, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import SaveIcon from '@mui/icons-material/Save';
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

interface CropChoice { value: number; display_name: string }
interface CropOptionsResponse {
    actions?: { POST?: { status?: { choices?: CropChoice[] } } };
}

const KC_MIN = 0;
const KC_MAX = 2;
const inKcRange = (v: number) => !Number.isNaN(v) && v > KC_MIN && v < KC_MAX;

const toKcInput = (v: string | null | undefined) => {
    if (v == null || v === '') return NaN;
    const n = parseFloat(v);
    return Number.isNaN(n) ? NaN : n;
};

const EditFarmCropPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canEdit = actions.includes('edit');

    const { id } = useParams();
    const cropId = id ?? '';

    const [name, setName] = useState<string>('');
    const [variety, setVariety] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [growthStage, setGrowthStage] = useState<string>('');
    const [selectedParcel, setSelectedParcel] = useState<string>('');
    const [statusStr, setStatusStr] = useState<string>('1');
    const [kcInit, setKcInit] = useState<number>(NaN);
    const [kcMid, setKcMid] = useState<number>(NaN);
    const [kcEnd, setKcEnd] = useState<number>(NaN);
    const [loaded, setLoaded] = useState<boolean>(false);

    const { fetchData, loading, response, error } = useFetch<FarmCropModel>(
        `proxy/farmcalendar/api/v1/FarmCrops/${cropId}/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<any>(
        `proxy/farmcalendar/api/v1/FarmCrops/${cropId}/`,
        { method: 'PATCH' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading crop');
    }, [error]);

    useEffect(() => {
        if (patchError) showSnackbar('error', 'Error saving crop');
    }, [patchError]);

    useEffect(() => {
        if (response) {
            setName(response.name ?? '');
            setVariety(response.cropSpecies?.variety ?? '');
            setDescription(response.description ?? '');
            setGrowthStage(response.growth_stage ?? '');
            setStatusStr(String(response.status ?? 1));
            setKcInit(toKcInput(response.kc_init));
            setKcMid(toKcInput(response.kc_mid));
            setKcEnd(toKcInput(response.kc_end));
            setSelectedParcel(response.hasAgriParcel?.["@id"]?.split(':').pop() ?? '');
            setLoaded(true);
        }
    }, [response]);

    useEffect(() => {
        if (patchResponse) navigate('/farm-crops');
    }, [patchResponse]);

    const nameEmpty = !name.trim();
    const varietyEmpty = !variety.trim();
    const parcelEmpty = !selectedParcel;
    const kcInitInvalid = !inKcRange(kcInit);
    const kcMidInvalid = !inKcRange(kcMid);
    const kcEndInvalid = !inKcRange(kcEnd);
    const isFormInvalid = nameEmpty || varietyEmpty || parcelEmpty || kcInitInvalid || kcMidInvalid || kcEndInvalid;

    const handleSave = () => {
        patchFetchData({
            body: {
                name: name.trim(),
                description: description.trim(),
                growth_stage: growthStage.trim(),
                status: parseInt(statusStr, 10),
                cropSpecies: { name: name.trim(), variety: variety.trim() },
                hasAgriParcel: { '@id': `urn:farmcalendar:Parcel:${selectedParcel}`, '@type': 'Parcel' },
                kc_init: String(kcInit),
                kc_mid: String(kcMid),
                kc_end: String(kcEnd),
            }
        });
    };

    return (
        <>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading || error) && loaded && (
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Typography variant={'h4'}>{name}</Typography>
                    <Card>
                        <CardContent>
                            <Stack direction={'column'} spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        fullWidth margin="normal" label="Crop name" name="name" required
                                        value={name} onChange={e => setName(e.target.value)}
                                        error={nameEmpty}
                                    />
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        fullWidth margin="normal" label="Variety" name="variety" required
                                        value={variety} onChange={e => setVariety(e.target.value)}
                                        error={varietyEmpty}
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
                                <TextField
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" label="Growth stage" name="growth_stage"
                                    value={growthStage} onChange={e => setGrowthStage(e.target.value)}
                                    helperText="e.g. BBCH 90"
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01, min: 0, max: 2 } }}
                                        fullWidth margin="normal" label="Kc init (0 < x < 2)" name="kc_init" type="number" required
                                        value={Number.isNaN(kcInit) ? '' : kcInit}
                                        onChange={e => setKcInit(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                        error={kcInitInvalid}
                                    />
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01, min: 0, max: 2 } }}
                                        fullWidth margin="normal" label="Kc mid (0 < x < 2)" name="kc_mid" type="number" required
                                        value={Number.isNaN(kcMid) ? '' : kcMid}
                                        onChange={e => setKcMid(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                        error={kcMidInvalid}
                                    />
                                    <TextField
                                        slotProps={{ input: { readOnly: !canEdit }, htmlInput: { step: 0.01, min: 0, max: 2 } }}
                                        fullWidth margin="normal" label="Kc end (0 < x < 2)" name="kc_end" type="number" required
                                        value={Number.isNaN(kcEnd) ? '' : kcEnd}
                                        onChange={e => setKcEnd(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                                        error={kcEndInvalid}
                                    />
                                </Stack>
                                <GenericSelect<CropChoice, CropOptionsResponse>
                                    canEdit={canEdit}
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
                                    slotProps={{ input: { readOnly: !canEdit } }}
                                    fullWidth margin="normal" multiline rows={3}
                                    label="Description" name="description"
                                    value={description} onChange={e => setDescription(e.target.value)}
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

export default EditFarmCropPage;
