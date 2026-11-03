import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography, useTheme } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState, useEffect } from "react";
import { ThreatModelCRUDActionsProps } from "./ThreatModelCRUDActions.types";
import { BioParams, FuzzyRule, RISK_LEVELS, RiskLevel, ThreatModel, ThreatModelCreate, ThreatModelUpdate } from "@models/ThreatModel";
import useFetch from "@hooks/useFetch";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useSnackbar from "@hooks/useSnackbar";
import useDialog from "@hooks/useDialog";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";

interface FormState {
    scientific_name: string;
    common_name: string;
    label: string;
    note: string;
    crop_id: string;
    bio_params: BioParams;
    fuzzy_rules: FuzzyRule[];
}

const BIO_PARAM_FIELDS: { key: keyof BioParams; label: string }[] = [
    { key: 't_base', label: 'T base' },
    { key: 't_lethal_min', label: 'T lethal min' },
    { key: 't_lethal_max', label: 'T lethal max' },
    { key: 't_optimal_min', label: 'T optimal min' },
    { key: 't_optimal_max', label: 'T optimal max' },
    { key: 'min_streak', label: 'Min streak' },
    { key: 'pheno_frac_lo', label: 'Pheno frac lo' },
    { key: 'pheno_frac_hi', label: 'Pheno frac hi' },
    { key: 'pheno_frac_ref_gdd5', label: 'Pheno frac ref GDD5' },
    { key: 'pheno_lo', label: 'Pheno lo' },
    { key: 'pheno_hi', label: 'Pheno hi' },
    { key: 'min_wetness_hours_critical', label: 'Min wetness hours critical' },
    { key: 'min_wetness_hours_high', label: 'Min wetness hours high' },
];

const createEmptyRule = (): FuzzyRule => ({
    hum_lo: 0,
    hum_hi: 100,
    temp_lo: -999,
    temp_hi: 999,
    rain_min: 0,
    risk_level: 'low',
    type: '',
});

const createEmptyForm = (): FormState => ({
    scientific_name: '',
    common_name: '',
    label: '',
    note: '',
    crop_id: '',
    bio_params: {},
    fuzzy_rules: [createEmptyRule()],
});

const fromThreatModel = (tm: ThreatModel): FormState => ({
    scientific_name: tm.scientific_name ?? '',
    common_name: tm.common_name ?? '',
    label: tm.label ?? '',
    note: tm.note ?? '',
    crop_id: tm.crop_id ?? '',
    bio_params: { ...(tm.definition?.bio_params ?? {}) },
    fuzzy_rules: Array.isArray(tm.definition?.fuzzy_rules) && tm.definition.fuzzy_rules.length > 0
        ? tm.definition.fuzzy_rules.map(r => ({ ...r }))
        : [createEmptyRule()],
});

const parseOptionalNumber = (raw: string): number | null => {
    if (raw === '' || raw === '-') return null;
    const v = Number(raw);
    return Number.isNaN(v) ? null : v;
};

const sanitizeBioParams = (bp: BioParams): BioParams => {
    const out: BioParams = {};
    (Object.keys(bp) as (keyof BioParams)[]).forEach(key => {
        const value = bp[key];
        if (value !== undefined && value !== null && !Number.isNaN(value)) {
            out[key] = value;
        }
    });
    return out;
};

const buildCreatePayload = (form: FormState): ThreatModelCreate => ({
    scientific_name: form.scientific_name.trim(),
    common_name: form.common_name.trim(),
    label: form.label.trim() === '' ? null : form.label.trim(),
    note: form.note.trim() === '' ? null : form.note.trim(),
    crop_id: form.crop_id,
    definition: {
        bio_params: sanitizeBioParams(form.bio_params),
        fuzzy_rules: form.fuzzy_rules.map(r => ({
            hum_lo: r.hum_lo ?? 0,
            hum_hi: r.hum_hi ?? 100,
            temp_lo: r.temp_lo ?? -999,
            temp_hi: r.temp_hi ?? 999,
            rain_min: r.rain_min ?? 0,
            risk_level: r.risk_level,
            type: r.type && r.type.trim() !== '' ? r.type.trim() : null,
        })),
    },
});

const buildUpdatePayload = (form: FormState): ThreatModelUpdate => ({
    scientific_name: form.scientific_name.trim(),
    common_name: form.common_name.trim(),
    label: form.label.trim() === '' ? null : form.label.trim(),
    note: form.note.trim() === '' ? null : form.note.trim(),
    definition: {
        bio_params: sanitizeBioParams(form.bio_params),
        fuzzy_rules: form.fuzzy_rules.map(r => ({
            hum_lo: r.hum_lo ?? 0,
            hum_hi: r.hum_hi ?? 100,
            temp_lo: r.temp_lo ?? -999,
            temp_hi: r.temp_hi ?? 999,
            rain_min: r.rain_min ?? 0,
            risk_level: r.risk_level,
            type: r.type && r.type.trim() !== '' ? r.type.trim() : null,
        })),
    },
});

const ThreatModelCRUDActions: React.FC<ThreatModelCRUDActionsProps> = ({ threatModel, crops, onAction, canEdit, canDelete }) => {
    const theme = useTheme();

    const [formData, setFormData] = useState<FormState>(createEmptyForm);

    useEffect(() => {
        setFormData(threatModel ? fromThreatModel(threatModel) : createEmptyForm());
    }, [threatModel]);

    const { dialogProps, showDialog } = useDialog();
    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    const { fetchData: postFetch, response: postResponse, error: postError, loading: postLoading } = useFetch<ThreatModel>(
        `proxy/pdm/api/v1/threat-model/`,
        { method: 'POST' }
    );

    const { fetchData: patchFetch, response: patchResponse, error: patchError, loading: patchLoading } = useFetch<ThreatModel>(
        `proxy/pdm/api/v1/threat-model/${threatModel?.id}/`,
        { method: 'PATCH' }
    );

    const { fetchData: deleteFetch, response: deleteResponse, error: deleteError, loading: deleteLoading } = useFetch<ThreatModel>(
        `proxy/pdm/api/v1/threat-model/${threatModel?.id}/`,
        { method: 'DELETE' }
    );

    useEffect(() => {
        if (postResponse) {
            onAction?.();
            showSnackbar('success', 'Threat model added successfully');
        }
    }, [postResponse]);

    useEffect(() => {
        if (patchResponse) {
            onAction?.();
            showSnackbar('success', 'Threat model updated successfully');
        }
    }, [patchResponse]);

    useEffect(() => {
        if (deleteResponse) {
            onAction?.();
            showSnackbar('success', 'Threat model deleted successfully');
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (postError) showSnackbar('error', postError.message || 'Error creating threat model');
    }, [postError]);

    useEffect(() => {
        if (patchError) showSnackbar('error', patchError.message || 'Error updating threat model');
    }, [patchError]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', deleteError.message || 'Error deleting threat model');
    }, [deleteError]);

    const handleTextChange = (field: keyof Pick<FormState, 'scientific_name' | 'common_name' | 'label' | 'note'>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setFormData(prev => ({ ...prev, [field]: e.target.value }));
        };

    const handleCropChange = (cropId: string) => {
        setFormData(prev => ({ ...prev, crop_id: cropId }));
    };

    const handleBioParamChange = (key: keyof BioParams, raw: string) => {
        setFormData(prev => ({
            ...prev,
            bio_params: { ...prev.bio_params, [key]: parseOptionalNumber(raw) },
        }));
    };

    const handleRuleNumberChange = (idx: number, key: 'hum_lo' | 'hum_hi' | 'temp_lo' | 'temp_hi' | 'rain_min', raw: string) => {
        const parsed = parseOptionalNumber(raw);
        setFormData(prev => ({
            ...prev,
            fuzzy_rules: prev.fuzzy_rules.map((r, i) =>
                i === idx ? { ...r, [key]: parsed === null ? undefined : parsed } : r
            ),
        }));
    };

    const handleRuleRiskLevelChange = (idx: number, level: RiskLevel) => {
        setFormData(prev => ({
            ...prev,
            fuzzy_rules: prev.fuzzy_rules.map((r, i) => i === idx ? { ...r, risk_level: level } : r),
        }));
    };

    const handleRuleTypeChange = (idx: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            fuzzy_rules: prev.fuzzy_rules.map((r, i) => i === idx ? { ...r, type: value } : r),
        }));
    };

    const handleAddRule = () => {
        setFormData(prev => ({ ...prev, fuzzy_rules: [...prev.fuzzy_rules, createEmptyRule()] }));
    };

    const handleRemoveRule = (idx: number) => {
        setFormData(prev => prev.fuzzy_rules.length <= 1
            ? prev
            : { ...prev, fuzzy_rules: prev.fuzzy_rules.filter((_, i) => i !== idx) }
        );
    };

    const handlePost = () => {
        postFetch({ body: buildCreatePayload(formData) });
    };

    const handlePatch = () => {
        patchFetch({ body: buildUpdatePayload(formData) });
    };

    const handleDelete = () => {
        deleteFetch();
    };

    const isFormInvalid =
        !formData.scientific_name.trim() ||
        !formData.common_name.trim() ||
        !formData.crop_id ||
        formData.fuzzy_rules.length < 1 ||
        formData.fuzzy_rules.some(r => !RISK_LEVELS.includes(r.risk_level));

    const loading = postLoading || patchLoading || deleteLoading;

    return (
        <>
            <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Stack direction="column" spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth
                            label="Scientific name"
                            value={formData.scientific_name}
                            onChange={handleTextChange('scientific_name')}
                            error={!formData.scientific_name.trim()}
                            inputProps={{ maxLength: 50 }}
                        />
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth
                            label="Common name"
                            value={formData.common_name}
                            onChange={handleTextChange('common_name')}
                            error={!formData.common_name.trim()}
                            inputProps={{ maxLength: 50 }}
                        />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth
                            label="Label"
                            value={formData.label}
                            onChange={handleTextChange('label')}
                            inputProps={{ maxLength: 50 }}
                        />
                        <FormControl fullWidth error={!formData.crop_id}>
                            <InputLabel id="crop-select-label">Crop</InputLabel>
                            <Select
                                labelId="crop-select-label"
                                label="Crop"
                                value={formData.crop_id}
                                readOnly={!canEdit}
                                onChange={(e) => handleCropChange(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Please select a crop</em>
                                </MenuItem>
                                {crops.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth
                        multiline
                        minRows={2}
                        label="Note"
                        value={formData.note}
                        onChange={handleTextChange('note')}
                        inputProps={{ maxLength: 300 }}
                    />
                </Stack>

                <Accordion sx={{ backgroundColor: theme.palette.background.default }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Bio parameters</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}>
                            {BIO_PARAM_FIELDS.map(({ key, label }) => {
                                const value = formData.bio_params[key];
                                return (
                                    <TextField
                                        key={key}
                                        slotProps={{ input: { readOnly: !canEdit } }}
                                        label={label}
                                        type="number"
                                        value={value === undefined || value === null || Number.isNaN(value) ? '' : value}
                                        onChange={(e) => handleBioParamChange(key, e.target.value)}
                                    />
                                );
                            })}
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Typography variant="h6">Fuzzy rules</Typography>
                {formData.fuzzy_rules.map((rule, idx) => {
                    const shouldShowRemoveButton = formData.fuzzy_rules.length > 1;
                    const humError = (rule.hum_lo ?? 0) < 0 || (rule.hum_hi ?? 100) > 100 || (rule.hum_lo ?? 0) > (rule.hum_hi ?? 100);
                    const tempError = (rule.temp_lo ?? -999) > (rule.temp_hi ?? 999);
                    const rainError = (rule.rain_min ?? 0) < 0;
                    return (
                        <Card key={`rule-${idx}`} sx={{ backgroundColor: theme.palette.background.default }}>
                            <CardContent>
                                <Stack direction="column" spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                        <Typography variant="body1" sx={{ minWidth: 60 }}>#{idx + 1}</Typography>
                                        <FormControl fullWidth>
                                            <InputLabel id={`risk-level-${idx}`}>Risk level</InputLabel>
                                            <Select
                                                labelId={`risk-level-${idx}`}
                                                label="Risk level"
                                                value={rule.risk_level}
                                                readOnly={!canEdit}
                                                onChange={(e) => handleRuleRiskLevelChange(idx, e.target.value as RiskLevel)}
                                            >
                                                {RISK_LEVELS.map(l => (
                                                    <MenuItem key={l} value={l}>{l}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Type"
                                            value={rule.type ?? ''}
                                            onChange={(e) => handleRuleTypeChange(idx, e.target.value)}
                                        />
                                        {shouldShowRemoveButton && (
                                            <IconButton disabled={!canEdit} aria-label="remove rule" onClick={() => handleRemoveRule(idx)}>
                                                <RemoveCircleOutlineIcon />
                                            </IconButton>
                                        )}
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Hum lo"
                                            type="number"
                                            value={rule.hum_lo ?? ''}
                                            onChange={(e) => handleRuleNumberChange(idx, 'hum_lo', e.target.value)}
                                            error={humError}
                                            inputProps={{ min: 0, max: 100 }}
                                        />
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Hum hi"
                                            type="number"
                                            value={rule.hum_hi ?? ''}
                                            onChange={(e) => handleRuleNumberChange(idx, 'hum_hi', e.target.value)}
                                            error={humError}
                                            inputProps={{ min: 0, max: 100 }}
                                        />
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Temp lo"
                                            type="number"
                                            value={rule.temp_lo ?? ''}
                                            onChange={(e) => handleRuleNumberChange(idx, 'temp_lo', e.target.value)}
                                            error={tempError}
                                        />
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Temp hi"
                                            type="number"
                                            value={rule.temp_hi ?? ''}
                                            onChange={(e) => handleRuleNumberChange(idx, 'temp_hi', e.target.value)}
                                            error={tempError}
                                        />
                                        <TextField
                                            slotProps={{ input: { readOnly: !canEdit } }}
                                            fullWidth
                                            label="Rain min"
                                            type="number"
                                            value={rule.rain_min ?? ''}
                                            onChange={(e) => handleRuleNumberChange(idx, 'rain_min', e.target.value)}
                                            error={rainError}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })}
                {canEdit && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRule}>
                            Add fuzzy rule
                        </Button>
                    </Box>
                )}

                <Divider />

                {threatModel && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            loading={loading}
                            loadingPosition="start"
                            disabled={!canDelete}
                            onClick={() => {
                                showDialog({
                                    title: 'Are you sure you want to delete this threat model?',
                                    variant: 'yes-no',
                                    children: <></>,
                                });
                            }}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            loading={loading}
                            loadingPosition="start"
                            disabled={isFormInvalid || !canEdit}
                            onClick={handlePatch}
                        >
                            Save changes
                        </Button>
                    </Box>
                )}
                {!threatModel && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            loading={loading}
                            loadingPosition="start"
                            disabled={isFormInvalid}
                            onClick={handlePost}
                        >
                            Add threat model
                        </Button>
                    </Box>
                )}
            </Box>
            <GenericDialog {...dialogProps} onYes={handleDelete} />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default ThreatModelCRUDActions;
