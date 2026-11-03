import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { Accordion, AccordionDetails, AccordionSummary, Box, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AddSoilType from "./AddSoilType/AddSoilType";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ServiceContextType } from "@layouts/services/IrrigationManagementLayout";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import useDialog from "@hooks/useDialog";
import { SoilTypeModel } from "@models/SoilType";

interface SoilRow {
    id: string;
    soil_type: string;
    field_capacity: number;
    wilting_point: number;
    actions: string;
}

const SoilTypesPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [rows, setRows] = useState<SoilRow[]>([]);
    const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
    const [expanded, setExpanded] = useState<boolean>(false);

    const { fetchData, loading, response, error } = useFetch<SoilTypeModel[]>(
        'proxy/irrigation/api/v1/dataset/soil-types/',
        { method: 'GET', noCache: true }
    );

    const { fetchData: deleteFetchData, response: deleteResponse, error: deleteError } = useFetch<any>(
        '',
        { method: 'DELETE' }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (error) showSnackbar('error', 'Error loading soil types');
    }, [error]);

    useEffect(() => {
        if (deleteError) showSnackbar('error', 'Error deleting soil type');
    }, [deleteError]);

    useEffect(() => {
        if (deleteResponse) {
            showSnackbar('success', 'Soil type deleted');
            fetchData();
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (response) {
            setRows(response.map(s => ({
                id: s.id,
                soil_type: s.soil_type,
                field_capacity: s.field_capacity,
                wilting_point: s.wilting_point,
                actions: '',
            })));
        }
    }, [response]);

    const navigate = useNavigate();

    const headCells: readonly HeadCell<SoilRow>[] = [
        { id: 'soil_type', numeric: false, label: 'Soil type' },
        { id: 'field_capacity', numeric: true, label: 'Field capacity' },
        { id: 'wilting_point', numeric: true, label: 'Wilting point' },
        { id: 'actions', numeric: false, label: 'Actions', disableSort: true, renderCell: (row) => (
            <Stack direction={'row'} spacing={1}>
                <IconButton
                    size="small"
                    disabled={!canEdit}
                    onClick={(e) => { e.stopPropagation(); navigate(`../soil-types/${row.id}`); }}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    disabled={!canDelete}
                    onClick={(e) => {
                        e.stopPropagation();
                        setPendingDelete({ id: row.id, label: row.soil_type });
                        showDialog({
                            title: `Delete soil type "${row.soil_type}"?`,
                            variant: 'yes-no',
                            children: <></>,
                        });
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Stack>
        ) },
    ];

    const handleDelete = async () => {
        if (!pendingDelete) return;
        await deleteFetchData({ url: `proxy/irrigation/api/v1/dataset/soil-types/${pendingDelete.id}/` });
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
                    <Typography component="span">Add new soil type</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <AddSoilType onAction={onAddNew} existingNames={rows.map(r => r.soil_type)} />
                </AccordionDetails>
            </Accordion>
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

export default SoilTypesPage;
