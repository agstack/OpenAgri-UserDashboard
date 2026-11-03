import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import useDialog from "@hooks/useDialog";
import { PesticideModel } from "@models/Pesticide";
import AddPesticide from "./AddPesticide/AddPesticide";

interface Row {
    id: string;
    hasCommercialName: string;
    hasActiveSubstance: string;
    isTargetedTowards: string;
    hasPreharvestInterval: number;
    hasCost: string;
    isPricePer: string;
    actions: string;
}

const PesticidesPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [rows, setRows] = useState<Row[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const { fetchData, loading, response, error } = useFetch<PesticideModel[]>(
        'proxy/farmcalendar/api/v1/Pesticides/?format=json',
        { method: 'GET' }
    );

    const { fetchData: deleteFetchData, response: deleteResponse, error: deleteError } = useFetch<any>(
        '',
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading pesticides');
    }, [error]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting pesticide');
    }, [deleteError]);

    useEffect(() => {
        if (deleteResponse) {
            showSnackbar('success', 'Pesticide deleted');
            fetchData();
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (Array.isArray(response)) {
            setRows(response.map(p => ({
                id: p["@id"].split(':').pop() ?? '',
                hasCommercialName: p.hasCommercialName,
                hasActiveSubstance: p.hasActiveSubstance,
                isTargetedTowards: p.isTargetedTowards,
                hasPreharvestInterval: p.hasPreharvestInterval,
                hasCost: p.hasCost,
                isPricePer: p.isPricePer,
                actions: '',
            })));
        }
    }, [response]);

    const navigate = useNavigate();

    const headCells: readonly HeadCell<Row>[] = [
        { id: 'hasCommercialName', numeric: false, label: 'Commercial name' },
        { id: 'hasActiveSubstance', numeric: false, label: 'Active substance' },
        { id: 'isTargetedTowards', numeric: false, label: 'Targeted' },
        { id: 'hasPreharvestInterval', numeric: true, label: 'Preharvest (days)' },
        { id: 'hasCost', numeric: true, label: 'Cost' },
        { id: 'isPricePer', numeric: false, label: 'Per' },
        { id: 'actions', numeric: false, label: 'Actions', disableSort: true, renderCell: (row) => (
            <Stack direction={'row'} spacing={1}>
                <IconButton size="small" disabled={!canEdit}
                    onClick={(e) => { e.stopPropagation(); navigate(`../pesticides/${row.id}`); }}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" disabled={!canDelete}
                    onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete({ id: row.id, label: row.hasCommercialName });
                        showDialog({ title: `Delete pesticide "${row.hasCommercialName}"?`, variant: 'yes-no', children: <></> });
                    }}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Stack>
        ) },
    ];

    const handleDelete = async () => {
        if (!pendingDelete) return;
        await deleteFetchData({ url: `proxy/farmcalendar/api/v1/Pesticides/${pendingDelete.id}/` });
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
                    <Typography component="span">Add new pesticide</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <AddPesticide onAction={onAddNew} />
                </AccordionDetails>
            </Accordion>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {!(loading) && !error && (
                <GenericSortableTable data={rows} headCells={headCells} />
            )}
            <GenericDialog {...dialogProps} onYes={handleDelete} />
            <GenericSnackbar type={snackbarState.type} message={snackbarState.message} open={snackbarState.open} onClose={closeSnackbar} />
        </Box>
    );
};

export default PesticidesPage;
