import useFetch from "@hooks/useFetch";
import { useEffect, useMemo, useState } from "react";
import GenericSnackbar from "../../shared/GenericSnackbar/GenericSnackbar";
import useSnackbar from "@hooks/useSnackbar";
import { FarmParcelModel } from "@models/FarmParcel";
import { FarmModel } from "@models/Farm";
import { useSession } from "@contexts/SessionContext";
import { Box, Button, Skeleton } from "@mui/material";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ParcelSelectionList from "./ParcelSelectionList/ParcelSelectionList";
import ClearIcon from '@mui/icons-material/Clear';

const ParcelSelectionModule = () => {

    const [parcels, setParcels] = useState<FarmParcelModel[]>([]);
    const [farms, setFarms] = useState<FarmModel[]>([]);
    const { session, setSession } = useSession();
    const [expanded, setExpanded] = useState<boolean>(!session?.farm_parcel);

    const { fetchData, loading, response, error } = useFetch<FarmParcelModel[]>(
        "proxy/farmcalendar/api/v1/FarmParcels/?format=json",
        {
            method: 'GET',
        }
    );

    const { fetchData: fetchFarms, response: farmsResponse } = useFetch<FarmModel[]>(
        "proxy/farmcalendar/api/v1/Farm/?format=json",
        { method: 'GET' },
    );

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
        fetchData();
        fetchFarms();
    }, [])

    useEffect(() => {
        if (Array.isArray(farmsResponse)) setFarms(farmsResponse);
    }, [farmsResponse])

    const farmNamesById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const f of farms) map[f["@id"]] = f.name;
        return map;
    }, [farms])

    useEffect(() => {
        if (error) {
            showSnackbar('error', 'Error loading parcel list');
        }
    }, [error])

    useEffect(() => {
        if (response) {
            setParcels(response)
        }
    }, [response])

    const selectFarmParcel = (parcel?: FarmParcelModel) => {
        setExpanded(!parcel);
        setSession(prevSession => {
            if (prevSession) {
                return {
                    ...prevSession,
                    farm_parcel: parcel,
                };
            }
            return null;
        });
    };

    const handleAccordionChange = () => {
        setExpanded(!expanded);
    };

    return (
        <Box sx={{ marginBottom: 2 }}>
            {loading && <Skeleton variant="rectangular" height={48} />}
            {
                !loading && !error &&
                <Accordion defaultExpanded={!session?.farm_parcel} expanded={expanded} onChange={handleAccordionChange}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                    >
                        {
                            session?.farm_parcel &&
                            <Typography component="span">
                                Selected parcel: {session.farm_parcel.identifier}
                            </Typography>
                        }
                        {
                            !session?.farm_parcel &&
                            <Typography component="span">
                                No parcel selected. You can select a parcel by clicking on it
                            </Typography>
                        }
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <ParcelSelectionList parcels={parcels} selectedParcelId={session?.farm_parcel?.["@id"]} f={selectFarmParcel} farmNamesById={farmNamesById}></ParcelSelectionList>
                            <Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<ClearIcon />}
                                    onClick={() => selectFarmParcel(undefined)}
                                >
                                    Clear selected parcel
                                </Button>
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            }
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </Box>
    )
};

export default ParcelSelectionModule;