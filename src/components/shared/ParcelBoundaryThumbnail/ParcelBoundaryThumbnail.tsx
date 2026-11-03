import { useMemo } from 'react';
import { alpha, useTheme } from '@mui/material';
import { parseWKTPolygonRings } from '@utils/wktPolygon';

interface ParcelBoundaryThumbnailProps {
    wkt: string;
    size: number;
    borderRadius?: number;
}

const ParcelBoundaryThumbnail: React.FC<ParcelBoundaryThumbnailProps> = ({ wkt, size, borderRadius = 4 }) => {
    const theme = useTheme();
    const rings = useMemo(() => parseWKTPolygonRings(wkt), [wkt]);

    const geometry = useMemo(() => {
        if (!rings.length) return null;
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        for (const ring of rings) {
            for (const [lng, lat] of ring) {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            }
        }
        const spanLng = maxLng - minLng || 1e-9;
        const spanLat = maxLat - minLat || 1e-9;
        const pad = 0.1;
        const scale = (1 - pad * 2) / Math.max(spanLng, spanLat);
        const offsetX = (1 - spanLng * scale) / 2;
        const offsetY = (1 - spanLat * scale) / 2;

        const toXY = ([lng, lat]: [number, number]): [number, number] => [
            offsetX + (lng - minLng) * scale,
            offsetY + (maxLat - lat) * scale,
        ];

        const polygons = rings.map(ring =>
            ring.map(toXY).map(([x, y]) => `${(x * 100).toFixed(3)},${(y * 100).toFixed(3)}`).join(' ')
        );
        return { polygons };
    }, [rings]);

    if (!geometry) return null;

    return (
        <svg
            viewBox="0 0 100 100"
            width={size}
            height={size}
            preserveAspectRatio="xMidYMid meet"
            style={{
                display: 'block',
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius,
                border: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
            }}
        >
            {geometry.polygons.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    fill={alpha(theme.palette.primary.main, 0.25)}
                    stroke={theme.palette.primary.main}
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </svg>
    );
};

export default ParcelBoundaryThumbnail;
