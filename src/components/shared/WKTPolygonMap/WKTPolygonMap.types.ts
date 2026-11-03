export interface WKTPolygonMapProps {
    value: string;
    onChange: (wkt: string) => void;
    readOnly?: boolean;
    center?: { lat: number | null; long: number | null };
    height?: number;
}
