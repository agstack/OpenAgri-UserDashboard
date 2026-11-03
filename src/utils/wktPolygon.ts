export const parseWKTPolygonRings = (wkt: string): [number, number][][] => {
    if (!wkt) return [];
    const upper = wkt.trim().toUpperCase();
    if (!/^(POLYGON|MULTIPOLYGON|GEOMETRYCOLLECTION)/.test(upper)) return [];
    const ringMatches = wkt.match(/\(([^()]+)\)/g);
    if (!ringMatches) return [];
    return ringMatches.map(r => {
        const body = r.slice(1, -1);
        return body.split(',').map(pair => {
            const [lng, lat] = pair.trim().split(/\s+/).map(Number);
            return [lng, lat] as [number, number];
        }).filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
    }).filter(ring => ring.length >= 3);
};

// WKT stores coordinates as "lng lat"; return the first vertex flipped to { lat, long }.
export const wktFirstLatLong = (wkt: string): { lat: number; long: number } | null => {
    const [firstRing] = parseWKTPolygonRings(wkt);
    if (!firstRing?.length) return null;
    const [lng, lat] = firstRing[0];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, long: lng };
};
