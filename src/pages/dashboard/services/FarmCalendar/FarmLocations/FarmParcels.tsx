import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import useFetch from "@hooks/useFetch";
import useSnackbar from "@hooks/useSnackbar";
import { FarmModel } from "@models/Farm";
import { FarmParcelModel } from "@models/FarmParcel";
import { Accordion, AccordionDetails, AccordionSummary, Box, Skeleton, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import AddFarmParcel from "./AddFarmParcel/AddFarmParcel";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ServiceContextType } from "@layouts/services/FarmCalendarLayout";


const FarmParcelsPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');

    const [parcels, setParcels] = useState<ParcelRow[]>([]);

    const [expanded, setExpanded] = useState<boolean>(false);

    const handleAccordionChange = () => {
        setExpanded(!expanded);
    };

    const { fetchData, loading, response, error } = useFetch<FarmParcelModel[]>(
        "proxy/farmcalendar/api/v1/FarmParcels/?format=json",
        {
            method: 'GET',
        }
    );

    const { fetchData: farmsFetchData, loading: farmsLoading, response: farmsResponse, error: farmsError } = useFetch<FarmModel[]>(
        "proxy/farmcalendar/api/v1/Farm/?format=json",
        {
            method: 'GET',
        }
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
        farmsFetchData();
    }, [])

    useEffect(() => {
        if (error || farmsError) {
            showSnackbar('error', 'Error loading parcel list');
        }
    }, [error, farmsError])

    useEffect(() => {
        if (response && farmsResponse) {
            const formattedParcels = response.map((p) => {
                return {
                    id: p["@id"],
                    farm: farmsResponse.find((f: FarmModel) => { return f["@id"] === p.farm["@id"] })?.name ?? 'N/A',
                    toponym: p.hasToponym,
                    identifier: p.identifier,
                    parcelType: p.category,
                    timestamps: `Created: ${dayjs(p.created_at)}\nUpdated: ${dayjs(p.updated_at)}`,
                }
            })
            setParcels(formattedParcels);
        }
    }, [response, farmsResponse])

    interface ParcelRow {
        id: string;
        farm: string;
        toponym: string;
        identifier: string;
        parcelType: string;
        timestamps: string;
    }

    const parcelHeadCells: readonly HeadCell<ParcelRow>[] = [
        { id: 'farm', numeric: false, label: 'Farm' },
        { id: 'toponym', numeric: false, label: 'Toponym' },
        { id: 'identifier', numeric: false, label: 'Identifier' },
        { id: 'parcelType', numeric: false, label: 'Parcel type' },
        { id: 'timestamps', numeric: false, label: 'Timestamps' },
    ];

    const navigate = useNavigate();

    const handleRowClick = (parcel: ParcelRow) => {
        navigate(`../farm-parcel/${parcel.id.split(":")[3]}`);
    };

    const onAddNewFarmParcel = () => {
        fetchData();
        setExpanded(false);
    };

    return (
        <Box display={'flex'} flexDirection={'column'} gap={2}>
            <Accordion disabled={!canAdd} expanded={expanded} onChange={handleAccordionChange}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography component="span">Add new farm parcel</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ maxHeight: 480, overflowY: 'scroll' }}>
                    <AddFarmParcel onAction={onAddNewFarmParcel}></AddFarmParcel>
                </AccordionDetails>
            </Accordion>
            {loading || farmsLoading && <Skeleton variant="rectangular" height={48} />}
            {
                !(loading || farmsLoading) && !error &&
                <GenericSortableTable data={parcels} headCells={parcelHeadCells} onRowClick={handleRowClick}></GenericSortableTable>
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

export default FarmParcelsPage;