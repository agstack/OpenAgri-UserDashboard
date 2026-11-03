import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Skeleton, Typography } from "@mui/material";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ThreatModel } from "@models/ThreatModel";
import { Crop } from "@models/Crop";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PublishIcon from '@mui/icons-material/Publish';
import useSnackbar from "@hooks/useSnackbar";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import { ServiceContextType } from "@layouts/services/PestAndDiseaseLayout";
import { useOutletContext } from "react-router-dom";
import useDialog from "@hooks/useDialog";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import ThreatModelCRUDActions from "@components/dashboard/services/ThreatModelCRUDActions/ThreatModelCRUDActions";

interface ThreatModelRow {
    id: string;
    commonName: string;
    scientificName: string;
    crop: string;
    label: string;
}

const ThreatModelsPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [threatModels, setThreatModels] = useState<ThreatModel[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [selectedThreatModel, setSelectedThreatModel] = useState<ThreatModel | undefined>(undefined);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();

    const { fetchData: getFetchData, response: getResponse, error: getError, loading: getLoading } = useFetch<ThreatModel[]>(
        `proxy/pdm/api/v1/threat-model/`,
        { method: 'GET' }
    );

    const { fetchData: getCropsFetch, response: cropsResponse } = useFetch<Crop[]>(
        `proxy/pdm/api/v1/crop/`,
        { method: 'GET' }
    );

    const { fetchData: uploadFetchData, response: uploadResponse, error: uploadError, loading: uploadLoading } = useFetch<any>(
        `proxy/pdm/api/v1/threat-model/import-excel/`,
        { method: 'POST' }
    );

    useEffect(() => {
        getFetchData();
        getCropsFetch();
    }, []);

    useEffect(() => {
        if (Array.isArray(getResponse)) setThreatModels(getResponse);
    }, [getResponse]);

    useEffect(() => {
        if (Array.isArray(cropsResponse)) setCrops(cropsResponse);
    }, [cropsResponse]);

    useEffect(() => {
        if (uploadResponse) {
            getFetchData();
            showSnackbar('success', 'Threat models imported successfully!');
            setExpanded(false);
            setSelectedFile(null);
        }
    }, [uploadResponse]);

    useEffect(() => {
        if (uploadError) {
            showSnackbar('error', uploadError?.message?.toString() ?? 'Error uploading file');
        }
    }, [uploadError]);

    const cropNameById = useMemo(() => {
        const map = new Map<string, string>();
        crops.forEach(c => map.set(c.id, c.name));
        return map;
    }, [crops]);

    const rows: ThreatModelRow[] = useMemo(() => threatModels.map(tm => ({
        id: tm.id,
        commonName: tm.common_name,
        scientificName: tm.scientific_name,
        crop: cropNameById.get(tm.crop_id) ?? '—',
        label: tm.label ?? '',
    })), [threatModels, cropNameById]);

    const headCells: readonly HeadCell<ThreatModelRow>[] = [
        { id: 'commonName', numeric: false, label: 'Common name' },
        { id: 'scientificName', numeric: false, label: 'Scientific name' },
        { id: 'crop', numeric: false, label: 'Crop' },
        { id: 'label', numeric: false, label: 'Label' },
    ];

    const handleRowClick = (row: ThreatModelRow) => {
        const tm = threatModels.find(t => t.id === row.id);
        if (!tm) return;
        setSelectedThreatModel(tm);
        showDialog({
            title: `Details for ${tm.common_name || tm.scientific_name}`,
            variant: 'empty',
            children: <></>,
        });
    };

    const handleCloseDialog = () => {
        dialogProps.onClose();
        setSelectedThreatModel(undefined);
    };

    const handleAccordionChange = () => setExpanded(prev => !prev);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        await uploadFetchData({ body: formData });
    };

    const onAfterEdit = () => {
        getFetchData();
        handleCloseDialog();
    };

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Accordion disabled={!canAdd} expanded={expanded} onChange={handleAccordionChange}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography component="span">Add new threat model</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ maxHeight: 640, overflowY: 'auto' }}>
                        <Box display={'flex'} flexDirection={'column'} gap={3}>
                            <Box>
                                <Typography variant="h6" gutterBottom>Bulk import from Excel</Typography>
                                <Typography variant="body1">
                                    Upload an Excel file containing threat model definitions.
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    The file needs to have <b>.xlsx</b> as its extension.
                                </Typography>
                                <Alert severity={selectedFile ? 'success' : 'info'} sx={{ my: 1 }}>
                                    {selectedFile ? 'File selected, please submit.' : 'Please select a file to import.'}
                                </Alert>
                                <Box display={'flex'} flexDirection={{ xs: 'column', md: 'row' }} gap={1}>
                                    <Box>
                                        <Button
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            tabIndex={-1}
                                            startIcon={<FileUploadIcon />}
                                        >
                                            Upload file
                                            <input
                                                type="file"
                                                accept=".xlsx"
                                                hidden
                                                onChange={handleFileChange}
                                            />
                                        </Button>
                                    </Box>
                                    <Box>
                                        <Button
                                            onClick={handleSubmit}
                                            startIcon={<PublishIcon />}
                                            loading={uploadLoading}
                                            loadingPosition="start"
                                            disabled={!selectedFile}
                                            variant="contained"
                                        >
                                            Submit
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="h6" gutterBottom>Create a single threat model</Typography>
                                <ThreatModelCRUDActions
                                    crops={crops}
                                    onAction={() => {
                                        getFetchData();
                                        setExpanded(false);
                                    }}
                                    canEdit={canAdd}
                                    canDelete={canDelete}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
                {getLoading && <Skeleton variant="rectangular" height={48} />}
                {!getLoading && !getError && (
                    <GenericSortableTable data={rows} headCells={headCells} onRowClick={handleRowClick} />
                )}
            </Box>
            <GenericDialog {...dialogProps} onClose={handleCloseDialog}>
                <ThreatModelCRUDActions
                    threatModel={selectedThreatModel}
                    crops={crops}
                    onAction={onAfterEdit}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            </GenericDialog>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default ThreatModelsPage;
