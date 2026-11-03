import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, IconButton, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import useDialog from "@hooks/useDialog";
import { FarmCropModel } from "@models/FarmCrop";
import { FarmParcelModel } from "@models/FarmParcel";
import AddFarmCrop from "./AddFarmCrop/AddFarmCrop";

interface CropRow {
    id: string;
    name: string;
    variety: string;
    growth_stage: string;
    kc_init: string;
    kc_mid: string;
    kc_end: string;
    parcel: string;
    actions: string;
}

const FarmCropsPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [rows, setRows] = useState<CropRow[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const [filterParcel, setFilterParcel] = useState<FarmParcelModel | null>(null);
    const selectedParcelId = filterParcel?.["@id"].split(':').pop() ?? '';

    const { fetchData, loading, response, error } = useFetch<FarmCropModel[]>(
        'proxy/farmcalendar/api/v1/FarmCrops/?format=json',
        { method: 'GET' }
    );

    const { fetchData: fetchParcels, response: parcelsResponse } = useFetch<FarmParcelModel[]>(
        'proxy/farmcalendar/api/v1/FarmParcels/?format=json',
        { method: 'GET' }
    );

    const parcelLabelById = useMemo(() => {
        const map: Record<string, string> = {};
        if (Array.isArray(parcelsResponse)) {
            for (const p of parcelsResponse) {
                const uuid = p["@id"].split(':').pop();
                if (uuid) map[uuid] = p.identifier;
            }
        }
        return map;
    }, [parcelsResponse]);

    const { fetchData: deleteFetchData, response: deleteResponse, error: deleteError } = useFetch<any>(
        '',
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();

    useEffect(() => { fetchParcels(); }, []);

    const refetchCrops = () => {
        const url = selectedParcelId
            ? `proxy/farmcalendar/api/v1/FarmCrops/?format=json&parcel=${selectedParcelId}`
            : 'proxy/farmcalendar/api/v1/FarmCrops/?format=json';
        fetchData({ url });
    };

    useEffect(() => {
        refetchCrops();
    }, [selectedParcelId]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading crops');
    }, [error]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting crop');
    }, [deleteError]);

    useEffect(() => {
        if (deleteResponse) {
            showSnackbar('success', 'Crop deleted');
            refetchCrops();
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (Array.isArray(response)) {
            setRows(response.map(c => ({
                id: c["@id"].split(':').pop() ?? '',
                name: c.name,
                variety: c.cropSpecies?.variety ?? '',
                growth_stage: c.growth_stage ?? '',
                kc_init: c.kc_init ?? '',
                kc_mid: c.kc_mid ?? '',
                kc_end: c.kc_end ?? '',
                parcel: parcelLabelById[c.hasAgriParcel?.["@id"]?.split(':').pop() ?? ''] ?? '',
                actions: '',
            })));
        }
    }, [response, parcelLabelById]);

    const navigate = useNavigate();

    const headCells: readonly HeadCell<CropRow>[] = [
        { id: 'name', numeric: false, label: 'Crop name' },
        { id: 'variety', numeric: false, label: 'Variety' },
        { id: 'growth_stage', numeric: false, label: 'Growth stage' },
        { id: 'kc_init', numeric: true, label: 'Kc init' },
        { id: 'kc_mid', numeric: true, label: 'Kc mid' },
        { id: 'kc_end', numeric: true, label: 'Kc end' },
        { id: 'parcel', numeric: false, label: 'Parcel' },
        {
            id: 'actions', numeric: false, label: 'Actions', disableSort: true, renderCell: (row) => (
                <Stack direction={'row'} spacing={1}>
                    <IconButton
                        size="small"
                        disabled={!canEdit}
                        onClick={(e) => { e.stopPropagation(); navigate(`../farm-crops/${row.id}`); }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        disabled={!canDelete}
                        onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete({ id: row.id, label: row.name });
                            showDialog({
                                title: `Delete crop "${row.name}"?`,
                                variant: 'yes-no',
                                children: <></>,
                            });
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        },
    ];

    const handleDelete = async () => {
        if (!pendingDelete) return;
        await deleteFetchData({ url: `proxy/farmcalendar/api/v1/FarmCrops/${pendingDelete.id}/` });
        setPendingDelete(null);
    };

    const onAddNew = () => {
        refetchCrops();
        setExpanded(false);
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Accordion disabled={!canAdd} expanded={expanded} onChange={() => setExpanded(v => !v)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">Add new crop</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <AddFarmCrop onAction={onAddNew} />
                </AccordionDetails>
            </Accordion>
            <Autocomplete
                size="small"
                sx={{ maxWidth: 360 }}
                options={Array.isArray(parcelsResponse) ? parcelsResponse : []}
                value={filterParcel}
                onChange={(_, v) => setFilterParcel(v)}
                getOptionLabel={p => `${p.identifier}${p.category ? ` (${p.category})` : ''}`}
                isOptionEqualToValue={(a, b) => a["@id"] === b["@id"]}
                renderInput={(params) => <TextField {...params} label="Filter by parcel" placeholder="All parcels" />}
            />
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading) && !error && (
                <GenericSortableTable data={rows} headCells={headCells} />
            )}
            <GenericDialog {...dialogProps} onYes={handleDelete} />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </Box>
    );
};

export default FarmCropsPage;
