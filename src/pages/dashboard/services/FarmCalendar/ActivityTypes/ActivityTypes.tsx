import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useDialog from "@hooks/useDialog";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

interface ActivityTypeRow {
    id: string;
    name: string;
    operations: null;
}

const ActivityTypesPage = () => {
    const navigate = useNavigate();
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();
    const { dialogProps, showDialog } = useDialog();

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const { fetchData: fetchList, response: listResponse, error: listError } = useFetch<FarmCalendarActivityTypeModel[]>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/?format=json`,
        { method: 'GET' }
    );

    const { fetchData: doDelete, response: deleteResponse, error: deleteError } = useFetch<boolean>(
        pendingDeleteId ? `proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/${pendingDeleteId}/` : '',
        { method: 'DELETE' }
    );

    useEffect(() => {
        fetchList();
    }, []);

    useEffect(() => {
        if (listError) showSnackbar('error', 'Error loading activity types');
    }, [listError]);

    useEffect(() => {
        if (deleteResponse) {
            showSnackbar('success', 'Activity type deleted');
            setPendingDeleteId(null);
            fetchList();
        }
    }, [deleteResponse]);

    useEffect(() => {
        if (deleteError) {
            showSnackbar('error', 'Error deleting activity type');
            setPendingDeleteId(null);
        }
    }, [deleteError]);

    const rows: ActivityTypeRow[] = useMemo(() => {
        if (!Array.isArray(listResponse)) return [];
        return listResponse.map(t => ({
            id: t["@id"].split(':').pop() ?? t["@id"],
            name: t.name,
            operations: null,
        }));
    }, [listResponse]);

    const handleEdit = (id: string) => {
        navigate(`edit/${id}`);
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
        showDialog({
            title: 'Are you sure you want to delete this activity type?',
            variant: 'yes-no',
            children: <></>,
        });
    };

    const confirmDelete = () => {
        if (pendingDeleteId) {
            doDelete();
        }
    };

    const headCells: HeadCell<ActivityTypeRow>[] = [
        { id: 'name', label: 'Name', numeric: false },
        {
            id: 'operations',
            label: 'Operations',
            numeric: false,
            disableSort: true,
            renderCell: (row) => (
                <Stack direction="row" spacing={1}>
                    <IconButton
                        color="primary"
                        disabled={!canEdit}
                        onClick={(e) => { e.stopPropagation(); handleEdit(row.id); }}
                        aria-label="edit"
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        disabled={!canDelete}
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                        aria-label="delete"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Stack>
            ),
        },
    ];

    return (
        <>
            <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="h4">Manage calendar activity types</Typography>
                <Box>
                    <Button
                        variant="contained"
                        disabled={!canAdd}
                        onClick={() => navigate('add')}
                    >
                        Add new activity type
                    </Button>
                </Box>
                <GenericSortableTable<ActivityTypeRow>
                    data={rows}
                    headCells={headCells}
                />
            </Box>
            <GenericDialog
                {...dialogProps}
                onClose={() => { dialogProps.onClose(); setPendingDeleteId(null); }}
                onYes={confirmDelete}
            />
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default ActivityTypesPage;
