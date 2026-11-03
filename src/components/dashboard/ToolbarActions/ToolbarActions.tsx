import { IconButton, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Popover, Stack, Tooltip } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from "react-router-dom";
import { useSession } from "@contexts/SessionContext";
import useFetch from "@hooks/useFetch";
import { clearUserCaches } from "@utils/pwaCache";
import OfflineChip from "@components/shared/OfflineChip/OfflineChip";
import PrepareOfflineButton from "@components/dashboard/PrepareOffline/PrepareOfflineButton";

const ToolbarActions = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);

    const toggleMenu = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            setMenuAnchorEl(isMenuOpen ? null : event.currentTarget);
            setIsMenuOpen((previousIsMenuOpen) => !previousIsMenuOpen);
        },
        [isMenuOpen],
    );


    const { session, setSession } = useSession();
    const navigate = useNavigate();

    const { fetchData, response, error } = useFetch<{ success: string }>(
        "logout/",
        {
            method: 'POST',
            body: { refresh: session?.user.refresh_token }
        }
    );

    useEffect(() => {
        if (response || error) {
            clearUserCaches().finally(() => {
                setSession(null);
                navigate("/");
            });
        }
    }, [response, error]);

    const handleSignOut = () => {
        fetchData();
    }

    return (
        <Stack direction="row" alignItems="center" spacing={1}>
            <OfflineChip />
            <PrepareOfflineButton />
            <Tooltip title="Settings" enterDelay={1000}>
                <div>
                    <IconButton type="button" aria-label="settings" onClick={toggleMenu}>
                        <PersonIcon />
                    </IconButton>
                </div>
            </Tooltip>
            <Popover
                open={isMenuOpen}
                anchorEl={menuAnchorEl}
                onClose={toggleMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                disableAutoFocus
            >
                <Paper sx={{ width: 200, maxWidth: '100%' }}>
                    <MenuList>
                        {/* <MenuItem>
                            <ListItemIcon>
                                <AccountCircleIcon fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText>Account</ListItemText>
                        </MenuItem> */}
                        {/* <Divider /> */}
                        <MenuItem onClick={handleSignOut}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Sign Out</ListItemText>
                        </MenuItem>
                    </MenuList>
                </Paper>
            </Popover>
        </Stack>
    );
}

export default ToolbarActions;