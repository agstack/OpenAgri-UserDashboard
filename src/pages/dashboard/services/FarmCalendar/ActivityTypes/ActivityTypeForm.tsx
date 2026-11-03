import { Box, Button, Card, CardContent, Stack, TextField } from "@mui/material";
import { MuiColorInput } from "mui-color-input";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
import SaveIcon from '@mui/icons-material/Save';
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";

export type ActivityTypeFormValues = Pick<
    FarmCalendarActivityTypeModel,
    'name' | 'description' | 'category' | 'background_color' | 'border_color' | 'text_color'
>;

interface CategoryChoice {
    value: string;
    display_name: string;
}

interface CategoryOptionsResponse {
    actions?: {
        POST?: {
            category?: {
                choices?: CategoryChoice[];
            };
        };
    };
}

interface ActivityTypeFormProps {
    values: ActivityTypeFormValues;
    setValues: React.Dispatch<React.SetStateAction<ActivityTypeFormValues>>;
    onSubmit: () => void;
    loading: boolean;
    canEdit: boolean;
    submitLabel: string;
}

const ActivityTypeForm: React.FC<ActivityTypeFormProps> = ({ values, setValues, onSubmit, loading, canEdit, submitLabel }) => {
    const handleText = (key: keyof ActivityTypeFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues(prev => ({ ...prev, [key]: e.target.value }));
    };

    const handleColor = (key: keyof ActivityTypeFormValues) => (value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const setCategory: React.Dispatch<React.SetStateAction<string>> = (val) => {
        setValues(prev => ({
            ...prev,
            category: typeof val === 'function' ? (val as (p: string) => string)(prev.category) : val,
        }));
    };

    const isInvalid = !values.name.trim() || !values.category.trim();

    return (
        <>
            <Card>
                <CardContent>
                    <Stack direction="column" spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label="Name"
                            required
                            value={values.name}
                            onChange={handleText('name')}
                            error={!values.name.trim()}
                        />
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" multiline rows={3} label="Description"
                            value={values.description}
                            onChange={handleText('description')}
                        />
                        <GenericSelect<CategoryChoice, CategoryOptionsResponse>
                            canEdit={canEdit}
                            endpoint='proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/?format=json'
                            method="OPTIONS"
                            label='Category'
                            selectedValue={values.category}
                            setSelectedValue={setCategory}
                            transformResponse={r => r.actions?.POST?.category?.choices ?? []}
                            getOptionLabel={item => item.display_name}
                            getOptionValue={item => item.value}
                            required
                            error={!values.category.trim()}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <MuiColorInput
                                fullWidth
                                label="Background color"
                                format="hex"
                                isAlphaHidden
                                value={values.background_color || '#ffffff'}
                                onChange={handleColor('background_color')}
                                disabled={!canEdit}
                            />
                            <MuiColorInput
                                fullWidth
                                label="Border color"
                                format="hex"
                                isAlphaHidden
                                value={values.border_color || '#000000'}
                                onChange={handleColor('border_color')}
                                disabled={!canEdit}
                            />
                            <MuiColorInput
                                fullWidth
                                label="Text color"
                                format="hex"
                                isAlphaHidden
                                value={values.text_color || '#000000'}
                                onChange={handleColor('text_color')}
                                disabled={!canEdit}
                            />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, marginTop: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    loading={loading}
                    loadingPosition="start"
                    disabled={!canEdit || isInvalid}
                    onClick={onSubmit}
                >
                    {submitLabel}
                </Button>
            </Box>
        </>
    );
};

export default ActivityTypeForm;
