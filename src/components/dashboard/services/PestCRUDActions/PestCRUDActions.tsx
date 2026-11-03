import { Box, Button, Card, CardContent, IconButton, TextField, Typography, Stack, Divider, useTheme } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useState, useEffect } from "react";
import { PestCRUDActionsProps } from "./PestCRUDActions.types";
import { PestModel } from "@models/Pest";
import useFetch from "@hooks/useFetch";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import useSnackbar from "@hooks/useSnackbar";
import useDialog from "@hooks/useDialog";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";

const createEmptyPest = () => ({
    id: '',
    name: '',
    description: '',
    eppo_code: '',
    base_gdd: NaN,
    gdd_points: [
        {
            id: 0,
            start: NaN,
            end: NaN,
            descriptor: ''
        }
    ]
});

const PestCRUDActions: React.FC<PestCRUDActionsProps> = ({ pest, onAction, canEdit, canDelete }) => {
    const theme = useTheme();

    const [formData, setFormData] = useState<PestModel | undefined>();

    useEffect(() => {
        setFormData(pest || createEmptyPest());
    }, [pest]);

    const handleAddGddPoint = () => {
        if (!formData?.gdd_points) return;
        const lastPoint = formData.gdd_points[formData.gdd_points.length - 1];
        if (isNaN(lastPoint.end)) return;

        const newPoint: PestModel['gdd_points'][0] = {
            id: Date.now(),
            start: lastPoint.end,
            end: NaN,
            descriptor: '',
        };

        setFormData({ ...formData, gdd_points: [...formData.gdd_points, newPoint] });
    };

    const { dialogProps, showDialog } = useDialog();

    const handleCloseDialog = () => {
        dialogProps.onClose();
    };

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    const { fetchData, response, error, loading } = useFetch<any>(
        `proxy/pdm/api/v1/disease/`,
        {
            method: 'POST',
            body: formData
        }
    );

    const { fetchData: patchFetchData, response: patchResponse, error: patchError } = useFetch<any>(
        `proxy/pdm/api/v1/disease/${pest?.id}/`,
        {
            method: 'PATCH',
            body: formData
        }
    );

    const { fetchData: deleteFetchData, response: deleteResponse, error: deleteError } = useFetch<any>( // TODO: add loading and add loading handling in generic yes-no dialog
        `proxy/pdm/api/v1/disease/${pest?.id}/`,
        {
            method: 'DELETE',
            body: formData
        }
    );

    useEffect(() => {
        if (response) {
            onAction && onAction();
            showSnackbar('success', "Pest added successfully");
        }
    }, [response]);

    useEffect(() => {
        if (patchResponse) {
            onAction && onAction();
            showSnackbar('success', "Pest edited successfully");
        }
    }, [patchResponse]);

    useEffect(() => {
        if (error || patchError) {
            showSnackbar('error', "An error occurred");
        }
    }, [error, patchError]);

    useEffect(() => {
        if (deleteResponse) {
            onAction && onAction();
            showSnackbar('success', "Successfully deleted pest");
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (deleteError) {
            showSnackbar('error', "An error occurred while deleting the pest");
        }
    }, [deleteError]);

    const handleRemoveGddPoint = () => {
        if (!formData?.gdd_points || formData.gdd_points.length <= 1) return;
        const updatedGddPoints = formData.gdd_points.slice(0, -1);
        setFormData({ ...formData, gdd_points: updatedGddPoints });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumericField = name === 'base_gdd';
        const finalValue = isNumericField ? parseFloat(value) : value;
        setFormData(prev => prev ? { ...prev, [name]: finalValue } : undefined);
    };

    const handleGddPointChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!formData) return;

        const { name, value } = e.target;
        const isNumericField = name === 'start' || name === 'end';
        const finalValue = isNumericField ? parseFloat(value) : value;

        let updatedGddPoints = formData.gdd_points.map((point, i) =>
            i === index ? { ...point, [name]: finalValue } : point
        );

        if (name === 'end' && index < updatedGddPoints.length - 1) {
            updatedGddPoints[index + 1].start = finalValue as number;
        }

        setFormData({ ...formData, gdd_points: updatedGddPoints });
    };

    const handlePost = () => {
        console.log("Form Data:", formData);
        fetchData();
    };

    const handlePatch = () => {
        console.log("Form Data:", formData);
        patchFetchData();
    };

    const handleDelete = () => {
        console.log("Form Data:", formData);
        deleteFetchData();
    };

    if (!formData) {
        return null;
    }

    const lastGddPoint = formData.gdd_points[formData.gdd_points.length - 1];
    const isAddDisabled = !lastGddPoint || isNaN(lastGddPoint.end);

    const isFormInvalid =
        !formData.name?.trim() ||
        !formData.description?.trim() ||
        !formData.eppo_code?.trim() ||
        isNaN(formData.base_gdd) ||
        formData.gdd_points.some(gddp => {
            const isEndValueError = !isNaN(gddp.start) && !isNaN(gddp.end) && gddp.end <= gddp.start;
            return isNaN(gddp.start) || gddp.start < 0 || isNaN(gddp.end) || isEndValueError || !gddp.descriptor?.trim();
        });

    return (
        <>
            <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Stack direction={'column'} spacing={2} >
                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Pest name" name="name" value={formData.name ?? ''} onChange={handleChange} error={!formData.name?.trim()} />
                    <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Pest description" name="description" value={formData.description ?? ''} onChange={handleChange} error={!formData.description?.trim()} />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="EPPO code" name="eppo_code" value={formData.eppo_code ?? ''} onChange={handleChange} error={!formData.eppo_code?.trim()} />
                        <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth margin="normal" label="Base GDD °C" name="base_gdd" type="number" value={isNaN(formData.base_gdd) ? '' : formData.base_gdd} onChange={handleChange} error={isNaN(formData.base_gdd)} />
                    </Stack>
                </Stack>

                <Typography variant="h6">GDD points</Typography>

                {formData.gdd_points.map((gddp, index) => {
                    const isLastPoint = index === formData.gdd_points.length - 1;
                    const shouldShowRemoveButton = isLastPoint && formData.gdd_points.length > 1;
                    const isEndValueError = !isNaN(gddp.start) && !isNaN(gddp.end) && gddp.end <= gddp.start;

                    return (
                        <Card key={gddp.id} sx={{ backgroundColor: theme.palette.background.default }}>
                            <CardContent>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField slotProps={{ input: { readOnly: !canEdit } }} label="From (°C·h)" name="start" type="number" value={isNaN(gddp.start) ? '' : gddp.start} onChange={(e) => handleGddPointChange(index, e)} disabled={index > 0 || formData.gdd_points.length > 1} error={isNaN(gddp.start) || gddp.start < 0} />
                                        <TextField slotProps={{ input: { readOnly: !canEdit } }} label="To (°C·h)" name="end" type="number" value={isNaN(gddp.end) ? '' : gddp.end} onChange={(e) => handleGddPointChange(index, e)} disabled={!isLastPoint} error={isNaN(gddp.end) || isEndValueError} />
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                        <TextField slotProps={{ input: { readOnly: !canEdit } }} fullWidth label="Descriptor" name="descriptor" value={gddp.descriptor ?? ''} onChange={(e) => handleGddPointChange(index, e)} sx={{ flexGrow: 1 }} error={!gddp.descriptor?.trim()} />
                                        {shouldShowRemoveButton && (<IconButton disabled={!canEdit} aria-label="remove" onClick={handleRemoveGddPoint}><RemoveCircleOutlineIcon /></IconButton>)}
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })}
                {canEdit &&
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddGddPoint} disabled={isAddDisabled}>
                            Add GDD Point
                        </Button>
                    </Box>
                }
                <Divider />
                {pest &&
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
                                    title: `Are you sure you want to delete this pest?`,
                                    variant: 'yes-no',
                                    children: <></>
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
                            Save Changes
                        </Button>
                    </Box>
                }
                {!pest &&
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
                            Add pest
                        </Button>
                    </Box>
                }
            </Box>
            <GenericDialog {...dialogProps} onClose={handleCloseDialog} onYes={handleDelete} />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default PestCRUDActions;