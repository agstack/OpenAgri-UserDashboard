import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmModel } from "@models/Farm";
import { Accordion, AccordionDetails, AccordionSummary, Box, Skeleton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddFarm from "./AddFarm/AddFarm";
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";

const FarmsPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');

    const [farms, setFarms] = useState<FarmRow[]>([]);

    const [expanded, setExpanded] = useState<boolean>(false);

    const handleAccordionChange = () => {
        setExpanded(!expanded);
    };

    const { fetchData, loading, response, error } = useFetch<FarmModel[]>(
        "proxy/farmcalendar/api/v1/Farm/?format=json",
        {
            method: 'GET',
        }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
    }, [])

    useEffect(() => {
        if (error) {
            showSnackbar('error', 'Error loading farms');
        }
    }, [error])

    useEffect(() => {
        if (response) {
            const formattedFarms = response.map((f) => {
                return {
                    id: f["@id"],
                    name: f.name,
                    description: f.description,
                    administrator: f.administrator,
                    contactPerson: `${f.contactPerson.firstname} ${f.contactPerson.lastname}`,
                    telephone: f.telephone,
                    vatId: f.vatID,
                    adminUnit: `${f.address.adminUnitL1}, ${f.address.adminUnitL2}`,
                    address: `${f.address.addressArea}, ${f.address.municipality}, ${f.address.community}`,
                }
            })
            setFarms(formattedFarms);
        }
    }, [response])

    interface FarmRow {
        id: string;
        name: string;
        description: string;
        administrator: string;
        contactPerson: string;
        telephone: string;
        vatId: string;
        adminUnit: string;
        address: string;
    }

    const parcelHeadCells: readonly HeadCell<FarmRow>[] = [
        { id: 'name', numeric: false, label: 'Name' },
        { id: 'description', numeric: false, label: 'Description' },
        { id: 'administrator', numeric: false, label: 'Administrator' },
        { id: 'contactPerson', numeric: false, label: 'Contact person' },
        { id: 'telephone', numeric: false, label: 'Telephone' },
        { id: 'vatId', numeric: false, label: 'VAT ID' },
        { id: 'adminUnit', numeric: false, label: 'Region / Subregion' },
        { id: 'address', numeric: false, label: 'Address' },
    ];

    const navigate = useNavigate();

    const handleRowClick = (farm: FarmRow) => {
        navigate(`../farm/${farm.id.split(":")[3]}`);
    };

    const onAddNewFarm = () => {
        fetchData();
        setExpanded(false);
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Accordion disabled={!canAdd} expanded={expanded} onChange={handleAccordionChange}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">Add new farm</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ maxHeight: 480, overflowY: 'scroll' }}>
                    <AddFarm onAction={onAddNewFarm}></AddFarm>
                </AccordionDetails>
            </Accordion>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {
                !loading && !error &&
                <GenericSortableTable data={farms} headCells={parcelHeadCells} onRowClick={handleRowClick}></GenericSortableTable>
            }
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </Box>
    )
}

export default FarmsPage;