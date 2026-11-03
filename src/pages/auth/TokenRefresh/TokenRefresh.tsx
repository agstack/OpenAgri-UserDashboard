import { Box, CircularProgress, Typography } from "@mui/material";

import logo from '/logo-color.png';

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import useFetch from "@hooks/useFetch";
import { useSession } from "@contexts/SessionContext";

const TokenRefreshPage = () => {
    const [searchParams] = useSearchParams();

    const navigate = useNavigate();
    const { session, setSession } = useSession();

    const refresh_token = session?.user.refresh_token;

    const { fetchData, response, error } = useFetch<{ access: string }>(
        "token/refresh/",
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: 'POST',
            body: { refresh: refresh_token }
        }
    );

    // Call the fetch function
    useEffect(() => {
        fetchData();
    }, []);

    // Put the token in the session
    useEffect(() => {
        if (response?.access) {
            setSession(prevSession => {
                if (prevSession) {
                    return {
                        ...prevSession,
                        user: {
                            token: response.access,
                            refresh_token: session?.user.refresh_token
                        }
                    };
                }
                return null;
            });
        }
    }, [response]);

    // Navigate away if the session has been changed
    useEffect(() => {
        if (response?.access && session?.user.token === response.access) {
            navigate(searchParams.get("callbackURL") ?? '/');
        }
    }, [session]);

    useEffect(() => {
        if (error) {
            if (!navigator.onLine) {
                return;
            }
            const callbackURL = encodeURIComponent(searchParams.get("callbackURL") ?? '/')
            navigate('/sign-in?callbackURL=' + callbackURL);
        }
    }, [error])

    useEffect(() => {
        const handleOnline = () => fetchData();
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <Box display={"flex"} justifyContent={"center"}>
            <Box alignItems={"center"} justifyContent={"center"} display={"flex"} flexDirection={"column"} gap={2}>
                <img className='' src={logo} alt="" width={"250px"} />
                <Typography variant="h6">Refreshing session</Typography>
                <Typography variant="body1" textAlign={"center"}>
                    Please wait while your session is being refreshed.
                </Typography>
                <CircularProgress />
            </Box>
        </Box>
    )
}

export default TokenRefreshPage;