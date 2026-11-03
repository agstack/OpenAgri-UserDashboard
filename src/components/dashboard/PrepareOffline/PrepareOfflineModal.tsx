import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { jwtDecode } from "jwt-decode";
import { useSession } from "@contexts/SessionContext";
import useFetch from "@hooks/useFetch";
import { FarmParcelModel } from "@models/FarmParcel";
import {
    buildPrefetchURLs,
    defaultDateRange,
    MAX_RANGE_DAYS,
    runPrefetch,
    statusText,
} from "@utils/prefetchOffline";

interface PrepareOfflineModalProps {
    open: boolean;
    onClose: () => void;
}

const REFRESH_THRESHOLD_SECONDS = 5 * 60;
const CONCURRENCY = 6;

const PrepareOfflineModal: React.FC<PrepareOfflineModalProps> = ({ open, onClose }) => {
    const { session, setSession } = useSession();

    const [from, setFrom] = useState<Dayjs | null>(defaultDateRange().from);
    const [to, setTo] = useState<Dayjs | null>(defaultDateRange().to);
    const [selectedParcels, setSelectedParcels] = useState<Set<string>>(new Set());
    const [parcels, setParcels] = useState<FarmParcelModel[]>([]);

    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [failures, setFailures] = useState<{ url: string; status: number }[]>([]);

    const { fetchData: fetchParcels, response: parcelsResponse } = useFetch<FarmParcelModel[]>(
        'proxy/farmcalendar/api/v1/FarmParcels/?format=json',
        { method: 'GET' },
    );

    useEffect(() => {
        if (open) {
            fetchParcels();
        }
    }, [open]);

    useEffect(() => {
        if (parcelsResponse) {
            setParcels(parcelsResponse);
            const currentParcelId = session?.farm_parcel?.["@id"].split(':').pop();
            if (currentParcelId) {
                setSelectedParcels(new Set([currentParcelId]));
            }
        }
    }, [parcelsResponse]);

    const rangeDays = useMemo(() => {
        if (!from || !to) return 0;
        return to.diff(from, 'day');
    }, [from, to]);

    const rangeInvalid = !from || !to || to.isBefore(from) || rangeDays > MAX_RANGE_DAYS;

    const toggleParcel = (id: string) => {
        setSelectedParcels(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedParcels(new Set(parcels.map(p => p["@id"].split(':').pop() ?? '')));
    const deselectAll = () => setSelectedParcels(new Set());

    const refreshAccessToken = async (refresh: string): Promise<string | null> => {
        const apiUrl = (window as any).env?.VITE_API_URL ?? import.meta.env.VITE_API_URL;
        try {
            const res = await fetch(apiUrl + 'token/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (!res.ok) return null;
            const data = await res.json() as { access: string };
            return data.access;
        } catch {
            return null;
        }
    };

    const startPrefetch = async () => {
        if (!session?.user.token || !from || !to) return;
        setRunning(true);
        setDone(false);
        setFailures([]);
        setProgress({ done: 0, total: 0 });

        let token = session.user.token;
        let needsRefresh = false;
        try {
            const decoded = jwtDecode<{ exp?: number }>(token);
            const expiresIn = (decoded.exp ?? 0) - Date.now() / 1000;
            if (expiresIn < REFRESH_THRESHOLD_SECONDS) needsRefresh = true;
        } catch {
            needsRefresh = true;
        }

        if (needsRefresh) {
            const refresh = session.user.refresh_token;
            const newToken = refresh ? await refreshAccessToken(refresh) : null;
            if (!newToken) {
                setRunning(false);
                setFailures([{ url: 'token/refresh/', status: 0 }]);
                setDone(true);
                return;
            }
            token = newToken;
            setSession(prev => prev ? { ...prev, user: { ...prev.user, token: newToken } } : null);
        }

        const selectedParcelObjects = parcels
            .filter(p => selectedParcels.has(p["@id"].split(':').pop() ?? ''))
            .map(p => ({
                id: p["@id"].split(':').pop() ?? '',
                lat: p.location?.lat ?? null,
                lon: p.location?.long ?? null,
            }));
        const urls = buildPrefetchURLs(selectedParcelObjects, from, to);

        const results = await runPrefetch(urls, token, CONCURRENCY, (d, t, fail) => {
            setProgress({ done: d, total: t });
            if (fail) setFailures(prev => [...prev, { url: fail.url, status: fail.status }]);
        });

        setRunning(false);
        setDone(true);
        const failed = results.filter(r => !r.ok).length;
        setProgress({ done: results.length - failed, total: results.length });
    };

    const retryFailed = async () => {
        if (!session?.user.token || failures.length === 0) return;
        const urlsToRetry = failures.map(f => f.url);
        const baseSuccess = progress.total - failures.length;
        setRunning(true);
        setDone(false);
        setFailures([]);
        setProgress(p => ({ done: baseSuccess, total: p.total }));

        const newFailures: { url: string; status: number }[] = [];
        let successCount = 0;
        await runPrefetch(urlsToRetry, session.user.token, CONCURRENCY, (_d, _t, fail) => {
            if (fail) newFailures.push({ url: fail.url, status: fail.status });
            else successCount++;
            setProgress(p => ({ done: baseSuccess + successCount, total: p.total }));
            setFailures([...newFailures]);
        });

        setRunning(false);
        setDone(true);
    };

    const handleClose = () => {
        if (running) return;
        setDone(false);
        setProgress({ done: 0, total: 0 });
        setFailures([]);
        onClose();
    };

    const percent = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    const canStart = !running && !rangeInvalid && selectedParcels.size > 0;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEscapeKeyDown={running}>
            <DialogTitle>Prepare for offline use</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        Pick a date range and parcels. Data for the selected range will be cached so you can use the app offline.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <DatePicker
                            label="From"
                            value={from}
                            onChange={setFrom}
                            maxDate={to ?? undefined}
                            disabled={running}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                        <DatePicker
                            label="To"
                            value={to}
                            onChange={setTo}
                            minDate={from ?? undefined}
                            maxDate={from ? from.add(MAX_RANGE_DAYS, 'day') : undefined}
                            disabled={running}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Stack>
                    {rangeInvalid && (
                        <Alert severity="warning">
                            Date range must be valid and span at most {MAX_RANGE_DAYS} days.
                        </Alert>
                    )}

                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">Parcels ({selectedParcels.size}/{parcels.length})</Typography>
                            <Stack direction="row" spacing={1}>
                                <Button size="small" onClick={selectAll} disabled={running}>Select all</Button>
                                <Button size="small" onClick={deselectAll} disabled={running}>Deselect all</Button>
                            </Stack>
                        </Stack>
                        <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                            {parcels.length === 0 && (
                                <Typography variant="body2" color="text.secondary">No parcels found.</Typography>
                            )}
                            {parcels.map(p => {
                                const id = p["@id"].split(':').pop() ?? '';
                                return (
                                    <FormControlLabel
                                        key={id}
                                        sx={{ display: 'flex' }}
                                        control={
                                            <Checkbox
                                                checked={selectedParcels.has(id)}
                                                onChange={() => toggleParcel(id)}
                                                disabled={running}
                                            />
                                        }
                                        label={`${p.identifier} (${p.category})`}
                                    />
                                );
                            })}
                        </Box>
                    </Box>

                    {(running || done) && (
                        <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">
                                    {done ? 'Done' : 'Caching...'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {progress.done} / {progress.total}
                                </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={percent} />
                        </Box>
                    )}

                    {failures.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" color="error" gutterBottom>
                                Failed endpoints ({failures.length})
                            </Typography>
                            <List dense sx={{ maxHeight: 150, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                {failures.map((f, i) => (
                                    <ListItem key={i}>
                                        <ListItemText
                                            primary={f.url}
                                            secondary={statusText(f.status)}
                                            slotProps={{ primary: { sx: { wordBreak: 'break-all', fontSize: '0.8rem' } } }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={running}>
                    {done ? 'Done' : 'Cancel'}
                </Button>
                {done && failures.length > 0 && (
                    <Button variant="outlined" color="warning" onClick={retryFailed} disabled={running}>
                        Retry failed ({failures.length})
                    </Button>
                )}
                {!done && (
                    <Button variant="contained" onClick={startPrefetch} disabled={!canStart}>
                        Start
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PrepareOfflineModal;
