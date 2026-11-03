import { Chip, Tooltip } from "@mui/material";
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useEffect, useState } from "react";

const OfflineChip = () => {
    const [offline, setOffline] = useState<boolean>(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setOffline(false);
        const handleOffline = () => setOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!offline) return null;

    return (
        <Tooltip title="You are offline. Showing cached data; changes will fail until connection is restored.">
            <Chip
                icon={<CloudOffIcon />}
                label="Offline"
                color="warning"
                size="medium"
                variant="filled"
            />
        </Tooltip>
    );
};

export default OfflineChip;
