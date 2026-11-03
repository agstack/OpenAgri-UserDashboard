import { Box, SxProps, Theme } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import ParcelBoundaryThumbnail from "@components/shared/ParcelBoundaryThumbnail/ParcelBoundaryThumbnail";
import { parseWKTPolygonRings } from "@utils/wktPolygon";

import placeholder from '/parcel-placeholder.png';

// Session-scoped memo of image URLs that failed to load. Prevents the flicker of
// re-attempting broken images every time a virtualized row is remounted.
const failedImageUrls = new Set<string>();

interface ParcelThumbnailProps {
    depictionUrl?: string;
    wkt?: string;
    identifier?: string;
    size: number;
    sx?: SxProps<Theme>;
}

const ParcelThumbnail: React.FC<ParcelThumbnailProps> = ({ depictionUrl, wkt, identifier, size, sx }) => {
    const trimmedUrl = (depictionUrl || '').trim();
    const trimmedWkt = (wkt || '').trim();
    const [imgErrored, setImgErrored] = useState<boolean>(() => failedImageUrls.has(trimmedUrl));

    useEffect(() => {
        setImgErrored(failedImageUrls.has(trimmedUrl));
    }, [trimmedUrl]);

    const handleImgError = () => {
        if (trimmedUrl) failedImageUrls.add(trimmedUrl);
        setImgErrored(true);
    };

    const hasValidWkt = useMemo(() => parseWKTPolygonRings(trimmedWkt).length > 0, [trimmedWkt]);
    const showImage = !!trimmedUrl && !imgErrored;
    const showWkt = !showImage && hasValidWkt;

    const containerSx: SxProps<Theme> = {
        width: size,
        height: size,
        borderRadius: 1,
        flexShrink: 0,
        ...(sx ?? {}),
    };

    if (showImage) {
        return (
            <Box
                component="img"
                src={trimmedUrl}
                alt={identifier ? `Image of ${identifier}` : 'Parcel image'}
                onError={handleImgError}
                sx={{ ...containerSx, objectFit: 'cover' }}
            />
        );
    }
    if (showWkt) {
        return (
            <Box sx={sx}>
                <ParcelBoundaryThumbnail wkt={trimmedWkt} size={size} />
            </Box>
        );
    }
    return (
        <Box
            component="img"
            src={placeholder}
            alt={identifier ? `Image of ${identifier}` : 'Parcel image'}
            sx={{ ...containerSx, objectFit: 'cover' }}
        />
    );
};

export default ParcelThumbnail;
