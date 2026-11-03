import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import PrepareOfflineModal from "./PrepareOfflineModal";

const PrepareOfflineButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Tooltip title="Prepare for offline use">
                <span>
                    <IconButton
                        onClick={() => setOpen(true)}
                        disabled={!navigator.onLine}
                        aria-label="prepare offline"
                    >
                        <DownloadForOfflineIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <PrepareOfflineModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default PrepareOfflineButton;
