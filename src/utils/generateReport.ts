export interface QualityCertification {
    cert_type?: string | null;
    cert_number?: string | null;
    cert_issuing_body?: string | null;
    cert_issue_date?: string | null;
    cert_expiry_date?: string | null;
    cert_notes?: string | null;
}

export interface FieldNotebookParams {
    parcel_id?: string;
    from_date?: string;
    to_date?: string;
    include_irrigation?: boolean;
    include_fertilization?: boolean;
    include_pesticides?: boolean;
    include_observations?: boolean;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_TRIES = 30;

const getApiUrl = () =>
    window.env?.VITE_API_URL ? window.env.VITE_API_URL : import.meta.env.VITE_API_URL;

const buildQuery = (params: FieldNotebookParams): string => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        qs.append(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : '';
};

const downloadPdf = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const generateFieldNotebook = async (
    token: string,
    params: FieldNotebookParams,
    certification?: QualityCertification | null,
): Promise<void> => {
    const apiUrl = getApiUrl();
    const authHeader = { Authorization: `Bearer ${token}` };

    const postRes = await fetch(
        `${apiUrl}proxy/reporting/api/v1/openagri-report/field-notebook/${buildQuery(params)}`,
        {
            method: 'POST',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify(certification ?? null),
            cache: 'no-store',
        },
    );
    if (!postRes.ok) throw new Error(`Failed to start report: ${postRes.status}`);
    const { uuid } = await postRes.json() as { uuid: string };

    for (let tries = 0; tries < MAX_POLL_TRIES; tries++) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        const pollRes = await fetch(
            `${apiUrl}proxy/reporting/api/v1/openagri-report/${uuid}/`,
            { method: 'GET', headers: authHeader, cache: 'no-store' },
        );
        if (!pollRes.ok) continue;
        const contentType = pollRes.headers.get('content-type') ?? '';
        if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
            const blob = await pollRes.blob();
            downloadPdf(blob, `field-notebook-${uuid}.pdf`);
            return;
        }
    }
    throw new Error('Report generation timed out');
};
