import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import GenericSortableTable from "@components/shared/GenericSortableTable/GenericSortableTable";
import { HeadCell } from "@components/shared/GenericSortableTable/GenericSortableTable.types";
import PestCRUDActions from "@components/dashboard/services/PestCRUDActions/PestCRUDActions";
import useDialog from "@hooks/useDialog";
import useFetch from "@hooks/useFetch";
import { PestModel, PestsResponseModel } from "@models/Pest";
import { Accordion, AccordionDetails, AccordionSummary, Box, Skeleton, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useOutletContext } from "react-router-dom";
import { ServiceContextType } from "@layouts/services/PestAndDiseaseLayout";

const PestsPage = () => {
    const { actions } = useOutletContext<ServiceContextType>();
    const canAdd = actions.includes('add');
    const canEdit = actions.includes('edit');
    const canDelete = actions.includes('delete');

    const [pests, setPests] = useState<PestRow[]>([]);
    const [selectedPest, setSelectedPest] = useState<PestModel | undefined>(undefined);

    const [expanded, setExpanded] = useState<boolean>(false);

    const { fetchData: getFetchData, response: getResponse, error: getError, loading: getLoading } = useFetch<PestsResponseModel>(
        `proxy/pdm/api/v1/disease/`,
        {
            method: 'GET',
        }
    );

    const { dialogProps, showDialog } = useDialog();

    useEffect(() => {
        getFetchData();
    }, []);

    useEffect(() => {
        if (getResponse) {
            const formattedPests = getResponse.diseases.map((p) => {
                return {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    eppoCode: p.eppo_code,
                    baseGDD: p.base_gdd,
                    gddPoints: p.gdd_points
                }
            })
            setPests(formattedPests);
        }
    }, [getResponse])

    interface PestRow {
        id: string;
        name: string;
        description: string;
        eppoCode: string;
        baseGDD: number;
        gddPoints: {
            id: number;
            start: number
            end: number
            descriptor: string;
        }[]
    }

    const pestsHeadCells: readonly HeadCell<PestRow>[] = [
        { id: 'name', numeric: false, label: 'Name' },
        { id: 'eppoCode', numeric: false, label: 'EPPO code' },
        { id: 'baseGDD', numeric: false, label: 'Base GDD (°C)' },
    ];

    const handleRowClick = (pest: PestRow) => {
        setSelectedPest({
            id: pest.id,
            name: pest.name,
            base_gdd: pest.baseGDD,
            eppo_code: pest.eppoCode,
            description: pest.description,
            gdd_points: pest.gddPoints
        });
        showDialog({
            title: `Details for ${pest.name}`,
            variant: 'empty',
            children: <></>
        });
    };

    const handleCloseDialog = () => {
        dialogProps.onClose();
        setSelectedPest(undefined);
    };

    const handleAccordionChange = () => {
        setExpanded(!expanded);
    };

    const onAddNewPest = () => {
        getFetchData();
        setExpanded(false);
    };

    const onEditPest = () => {
        getFetchData();
        handleCloseDialog();
    };

    return (
        <>
            <Box display={'flex'} flexDirection={'column'} gap={2}>
                <Accordion disabled={!canAdd} expanded={expanded} onChange={handleAccordionChange}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography component="span">Add new pest</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ maxHeight: 480, overflowY: 'scroll' }}>
                        <PestCRUDActions onAction={onAddNewPest} canEdit={canAdd} canDelete={canDelete}></PestCRUDActions>
                    </AccordionDetails>
                </Accordion>
                {getLoading && <Skeleton variant="rectangular" height={48} />}
                {
                    !getLoading && !getError &&
                    <GenericSortableTable data={pests} headCells={pestsHeadCells} onRowClick={handleRowClick}></GenericSortableTable>
                }
            </Box>
            <GenericDialog {...dialogProps} onClose={handleCloseDialog}>
                <PestCRUDActions pest={selectedPest} onAction={onEditPest} canEdit={canEdit} canDelete={canDelete}></PestCRUDActions>
            </GenericDialog>
        </>
    )
}

export default PestsPage;