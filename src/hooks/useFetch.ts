import { useSession } from "@contexts/SessionContext";
import { useState } from "react";

interface FetchOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
    headers?: Record<string, string>;
    body?: any;
    responseType?: 'json' | 'blob';
    url?: string;
    noCache?: boolean;
}

const useFetch = <FetchResponse = any>(
    url: string,
    { method = 'GET', headers = {}, body = null, responseType = 'json' }: FetchOptions = {}
) => {
    const [response, setResponse] = useState<FetchResponse | undefined>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { session, setSession } = useSession();
    const apiUrl = window.env?.VITE_API_URL ? window.env?.VITE_API_URL : import.meta.env.VITE_API_URL;

    const fetchData = async (dynamicOptions: Partial<FetchOptions> = {}) => {
        setLoading(true);
        setResponse(undefined);
        setError(null);

        const currentOptions = { method, headers, body, responseType, ...dynamicOptions };

        try {
            const getFetchOptions = (token: string | undefined) => {
                let finalBody: BodyInit | null = null;

                if (currentOptions.body && currentOptions.method !== "GET" && currentOptions.method !== "DELETE") {
                    if (currentOptions.body instanceof FormData) {
                        finalBody = currentOptions.body;
                    } else if (currentOptions.body instanceof URLSearchParams) {
                        finalBody = currentOptions.body.toString();
                    } else {
                        finalBody = JSON.stringify(currentOptions.body);
                    }
                }

                const finalHeaders: Record<string, string> = { ...currentOptions.headers };

                if (currentOptions.responseType === 'json' && !(currentOptions.body instanceof FormData)) {
                    finalHeaders["Content-Type"] = "application/json";
                }

                if (token) {
                    finalHeaders["Authorization"] = `Bearer ${token}`;
                }

                const opts: RequestInit = {
                    method: currentOptions.method,
                    headers: finalHeaders,
                    body: finalBody,
                };
                if (currentOptions.noCache) opts.cache = 'no-store';
                return opts;
            };

            const initialToken = session?.user?.token;
            let fetchOptions = getFetchOptions(initialToken);
            let response = await fetch(apiUrl + (currentOptions.url ?? url), fetchOptions);

            if (response.status === 401) {
                const refreshToken = session?.user?.refresh_token;
                if (!refreshToken) {
                    throw new Error("Session expired. Please log in again.");
                }

                const refreshResponse = await fetch(apiUrl + "token/refresh/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh: refreshToken }),
                });

                if (!refreshResponse.ok) {
                    throw new Error("Session expired. Please log in again.");
                }

                const newToken: { access: string; } = await refreshResponse.json();

                setSession(prevSession => {
                    if (prevSession) {
                        return {
                            ...prevSession,
                            user: {
                                ...prevSession.user,
                                token: newToken.access
                            }
                        };
                    }
                    return null;
                });

                fetchOptions = getFetchOptions(newToken.access);
                response = await fetch(apiUrl + (currentOptions.url ?? url), fetchOptions);
            }

            if (!response.ok) {
                try {
                    const result: any = await response.json();
                    throw new Error(result.detail || `HTTP Error: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }
            }
            if (response.status === 202) {
                setResponse('202' as FetchResponse);

            } else if (response.status === 204) {
                setResponse(true as FetchResponse);
            }
            else if (currentOptions.responseType === 'blob') {
                const blobResult = await response.blob();
                setResponse(blobResult as FetchResponse);
            } else {
                const jsonResult: FetchResponse = await response.json();
                setResponse(jsonResult);
            }
            setError(null);
        } catch (err) {
            setResponse(undefined);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    return { fetchData, response, loading, error };
};

export default useFetch;