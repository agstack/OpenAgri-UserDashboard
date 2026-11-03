import dayjs from "dayjs";

const GLOBAL_ENDPOINTS = [
    'proxy/farmcalendar/api/v1/FarmCalendarActivityTypes/?format=json',
    'proxy/farmcalendar/api/v1/Farm/?format=json',
    'proxy/farmcalendar/api/v1/FarmParcels/?format=json',
    'proxy/farmcalendar/api/v1/FarmAnimals/?format=json',
    'proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json',
    'proxy/farmcalendar/api/v1/Pesticides/?format=json',
    'proxy/farmcalendar/api/v1/Fertilizers/?format=json',
    'proxy/farmcalendar/api/v1/Observations/?format=json',
    'proxy/pdm/api/v1/crop/',
    'proxy/pdm/api/v1/disease/',
    'proxy/pdm/api/v1/threat-model/',
    'proxy/irrigation/api/v1/dataset/soil-types/',
    'proxy/farmcalendar/api/v1/FarmCrops/?format=json',
    'me/',
];

export interface PrefetchParcel {
    id: string;
    lat: number | null;
    lon: number | null;
}

export const buildPrefetchURLs = (
    parcels: PrefetchParcel[],
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
): string[] => {
    const urls = [...GLOBAL_ENDPOINTS];

    const monthRanges: { from: string; to: string }[] = [];
    let cursor = from.startOf('month');
    const end = to.endOf('month');
    while (cursor.isBefore(end) || cursor.isSame(end, 'month')) {
        monthRanges.push({
            from: cursor.startOf('month').format('YYYY-MM-DD'),
            to: cursor.endOf('month').format('YYYY-MM-DD'),
        });
        cursor = cursor.add(1, 'month');
    }

    for (const p of parcels) {
        for (const range of monthRanges) {
            urls.push(
                `proxy/farmcalendar/api/v1/FarmCalendarActivities/?parcel=${p.id}&format=json&fromDate=${range.from}&toDate=${range.to}`,
            );
        }
        urls.push(`proxy/farmcalendar/api/v1/FarmCrops/?format=json&parcel=${p.id}`);
        if (p.lat !== null && p.lon !== null) {
            urls.push(
                `proxy/weather_data/api/data/forecast5/?lat=${p.lat}&lon=${p.lon}`,
                `proxy/weather_data/api/data/spray-forecast/?lat=${p.lat}&lon=${p.lon}`,
                `proxy/weather_data/api/data/flight-forecast5/?lat=${p.lat}&lon=${p.lon}`,
            );
        }
    }
    return urls;
};

const getApiUrl = (): string =>
    (window as any).env?.VITE_API_URL ? (window as any).env.VITE_API_URL : import.meta.env.VITE_API_URL;

interface PrefetchResult {
    url: string;
    ok: boolean;
    status: number;
}

const fetchOne = async (url: string, token: string): Promise<PrefetchResult> => {
    const apiUrl = getApiUrl();
    try {
        const res = await fetch(apiUrl + url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        return { url, ok: res.ok, status: res.status };
    } catch {
        return { url, ok: false, status: 0 };
    }
};

export const runPrefetch = async (
    urls: string[],
    token: string,
    concurrency: number,
    onProgress: (done: number, total: number, lastFailure: PrefetchResult | null) => void,
): Promise<PrefetchResult[]> => {
    const results: PrefetchResult[] = [];
    let cursor = 0;

    const worker = async () => {
        while (cursor < urls.length) {
            const idx = cursor++;
            const result = await fetchOne(urls[idx], token);
            results.push(result);
            onProgress(results.length, urls.length, result.ok ? null : result);
        }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
    return results;
};

export const statusText = (status: number): string => {
    if (status === 0) return 'Network error (no response)';
    switch (status) {
        case 400: return 'Bad request';
        case 401: return 'Unauthorized';
        case 403: return 'Forbidden';
        case 404: return 'Not found';
        case 408: return 'Request timeout';
        case 429: return 'Too many requests';
        case 500: return 'Internal server error';
        case 502: return 'Bad gateway';
        case 503: return 'Service unavailable';
        case 504: return 'Gateway timeout';
    }
    if (status >= 400 && status < 500) return `Client error (${status})`;
    if (status >= 500 && status < 600) return `Server error (${status})`;
    return `Status ${status}`;
};

export const DEFAULT_FROM_OFFSET_DAYS = 30;
export const DEFAULT_TO_OFFSET_DAYS = 300;
export const MAX_RANGE_DAYS = 365;

export const defaultDateRange = () => ({
    from: dayjs().subtract(DEFAULT_FROM_OFFSET_DAYS, 'day'),
    to: dayjs().add(DEFAULT_TO_OFFSET_DAYS, 'day'),
});
