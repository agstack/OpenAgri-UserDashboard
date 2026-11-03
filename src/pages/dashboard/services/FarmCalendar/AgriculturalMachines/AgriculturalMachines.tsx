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
import { AgriculturalMachine } from "@models/AgriculturalMachine";
import AddAgriculturalMachine from "./AddAgriculturalMachine/AddAgriculturalMachine";
import { FarmParcelModel } from "@models/FarmParcel";

interface MachineRow {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    seria_number: string;
    purchase_date: string;
    parcel: string;
    actions: string;
}

const AgriculturalMachinesPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [rows, setRows] = useState<MachineRow[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const [filterParcel, setFilterParcel] = useState<FarmParcelModel | null>(null);
    const selectedParcelId = filterParcel?.["@id"].split(':').pop() ?? '';

    const { fetchData, loading, response, error } = useFetch<AgriculturalMachine[]>(
        'proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json',
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

    const refetchMachines = () => {
        const url = selectedParcelId
            ? `proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json&parcel=${selectedParcelId}`
            : 'proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json';
        fetchData({ url });
    };

    useEffect(() => {
        refetchMachines();
    }, [selectedParcelId]);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading machines');
    }, [error]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting machine');
    }, [deleteError]);

    useEffect(() => {
        if (deleteResponse) {
            showSnackbar('success', 'Machine deleted');
            refetchMachines();
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (Array.isArray(response)) {
            setRows(response.map(m => ({
                id: m["@id"].split(':').pop() ?? '',
                name: m.name,
                manufacturer: m.manufacturer,
                model: m.model,
                seria_number: m.seria_number,
                purchase_date: m.purchase_date,
                parcel: parcelLabelById[m.hasAgriParcel?.["@id"]?.split(':').pop() ?? ''] ?? '',
                actions: '',
            })));
        }
    }, [response, parcelLabelById]);

    const navigate = useNavigate();

    const headCells: readonly HeadCell<MachineRow>[] = [
        { id: 'name', numeric: false, label: 'Name' },
        { id: 'manufacturer', numeric: false, label: 'Manufacturer' },
        { id: 'model', numeric: false, label: 'Model' },
        { id: 'seria_number', numeric: false, label: 'Serial number' },
        { id: 'purchase_date', numeric: false, label: 'Purchase date' },
        { id: 'parcel', numeric: false, label: 'Parcel' },
        {
            id: 'actions', numeric: false, label: 'Actions', disableSort: true, renderCell: (row) => (
                <Stack direction={'row'} spacing={1}>
                    <IconButton
                        size="small"
                        disabled={!canEdit}
                        onClick={(e) => { e.stopPropagation(); navigate(`../agricultural-machines/${row.id}`); }}
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
                                title: `Delete machine "${row.name}"?`,
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
        await deleteFetchData({ url: `proxy/farmcalendar/api/v1/AgriculturalMachines/${pendingDelete.id}/` });
        setPendingDelete(null);
    };

    const onAddNew = () => {
        fetchData();
        setExpanded(false);
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Accordion disabled={!canAdd} expanded={expanded} onChange={() => setExpanded(v => !v)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">Add new machine</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <AddAgriculturalMachine onAction={onAddNew} />
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

export default AgriculturalMachinesPage;
