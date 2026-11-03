import ContentGuard from "@components/shared/ContentGuard/ContentGuard";
import DateRangeSelect from "@components/shared/DateRangeSelect/DateRangeSelect";
import GenericSnackbar from "@components/shared/GenericSnackbar/GenericSnackbar";
import ParcelSelectionModule from "@components/dashboard/ParcelSelectionModule/ParcelSelectionModule";
import { useSession } from "@contexts/SessionContext";
import useSnackbar from "@hooks/useSnackbar";
import { Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Dayjs } from "dayjs";
import { generateFieldNotebook, QualityCertification } from "@utils/generateReport";

const emptyCert: QualityCertification = {
    cert_type: '',
    cert_number: '',
    cert_issuing_body: '',
    cert_issue_date: '',
    cert_expiry_date: '',
    cert_notes: '',
};

const FieldNotebookReportPage = () => {
    const { session } = useSession();

    const [fromDate, setFromDate] = useState<Dayjs | null>(null);
    const [toDate, setToDate] = useState<Dayjs | null>(null);

    const [includeIrrigation, setIncludeIrrigation] = useState<boolean>(true);
    const [includeFertilization, setIncludeFertilization] = useState<boolean>(true);
    const [includePesticides, setIncludePesticides] = useState<boolean>(true);
    const [includeObservations, setIncludeObservations] = useState<boolean>(true);

    const [attachCert, setAttachCert] = useState<boolean>(false);
    const [cert, setCert] = useState<QualityCertification>({ ...emptyCert });

    const [loading, setLoading] = useState<boolean>(false);

    const { snackbarState, showSnackbar, closeSnackbar } = useSnackbar();

    const handleCertChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCert(prev => ({ ...prev, [name]: value }));
    };

    const parcelId = session?.farm_parcel?.["@id"].split(':')[3];

    const handleGenerate = async () => {
        if (!session?.user?.token) return;
        setLoading(true);
        try {
            await generateFieldNotebook(
                session.user.token,
                {
                    parcel_id: parcelId,
                    from_date: fromDate ? fromDate.format('YYYY-MM-DD') : undefined,
                    to_date: toDate ? toDate.format('YYYY-MM-DD') : undefined,
                    include_irrigation: includeIrrigation,
                    include_fertilization: includeFertilization,
                    include_pesticides: includePesticides,
                    include_observations: includeObservations,
                },
                attachCert ? cert : null,
            );
        } catch (e: any) {
            showSnackbar('error', e?.message ?? 'Error generating report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ParcelSelectionModule />
            <ContentGuard condition={!!session?.farm_parcel}>
                <Box display={'flex'} flexDirection={'column'} gap={2}>
                    <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body1">
                                Generate a unified Field Notebook PDF for the selected parcel. Combines pest treatment, fertilization, irrigation and observations in chronological order.
                            </Typography>
                            <DateRangeSelect
                                fromDate={fromDate}
                                setFromDate={setFromDate}
                                toDate={toDate}
                                setToDate={setToDate}
                            />
                            <Divider />
                            <Typography variant="subtitle2">Sections to include</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
                                <FormControlLabel control={<Checkbox checked={includeIrrigation} onChange={e => setIncludeIrrigation(e.target.checked)} />} label="Irrigation" />
                                <FormControlLabel control={<Checkbox checked={includeFertilization} onChange={e => setIncludeFertilization(e.target.checked)} />} label="Fertilization" />
                                <FormControlLabel control={<Checkbox checked={includePesticides} onChange={e => setIncludePesticides(e.target.checked)} />} label="Pesticides" />
                                <FormControlLabel control={<Checkbox checked={includeObservations} onChange={e => setIncludeObservations(e.target.checked)} />} label="Observations" />
                            </Stack>
                            <Divider />
                            <FormControlLabel
                                control={<Checkbox checked={attachCert} onChange={e => setAttachCert(e.target.checked)} />}
                                label="Attach quality certification"
                            />
                            {attachCert && (
                                <Stack direction={'column'} spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="Certificate type" name="cert_type" value={cert.cert_type ?? ''} onChange={handleCertChange} />
                                        <TextField fullWidth label="Certificate number" name="cert_number" value={cert.cert_number ?? ''} onChange={handleCertChange} />
                                    </Stack>
                                    <TextField fullWidth label="Issuing body" name="cert_issuing_body" value={cert.cert_issuing_body ?? ''} onChange={handleCertChange} />
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <TextField fullWidth label="Issue date" name="cert_issue_date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={cert.cert_issue_date ?? ''} onChange={handleCertChange} />
                                        <TextField fullWidth label="Expiry date" name="cert_expiry_date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={cert.cert_expiry_date ?? ''} onChange={handleCertChange} />
                                    </Stack>
                                    <TextField fullWidth multiline rows={3} label="Notes" name="cert_notes" value={cert.cert_notes ?? ''} onChange={handleCertChange} />
                                </Stack>
                            )}
                            <Box>
                                <Button
                                    variant="contained"
                                    startIcon={<InsertDriveFileIcon />}
                                    loading={loading}
                                    loadingPosition="start"
                                    onClick={handleGenerate}
                                    disabled={!parcelId}
                                >
                                    Generate field notebook
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </ContentGuard>
            <GenericSnackbar
                type={snackbarState.type}
                message={snackbarState.message}
                open={snackbarState.open}
                onClose={closeSnackbar}
            />
        </>
    );
};

export default FieldNotebookReportPage;
