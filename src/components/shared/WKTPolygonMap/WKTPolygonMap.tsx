import 'ol/ol.css';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, TextField, Tooltip } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import WKT from 'ol/format/WKT';
import { fromLonLat } from 'ol/proj';
import Polygon from 'ol/geom/Polygon';
import MultiPolygon from 'ol/geom/MultiPolygon';
import GeometryCollection from 'ol/geom/GeometryCollection';
import Geometry from 'ol/geom/Geometry';
import { createEmpty, extend, isEmpty, Extent } from 'ol/extent';

import { WKTPolygonMapProps } from './WKTPolygonMap.types';

const wktFormat = new WKT();
const DATA_PROJ = 'EPSG:4326';
const FEATURE_PROJ = 'EPSG:3857';
const DEFAULT_CENTER: [number, number] = [15, 45];
const DEFAULT_ZOOM = 5;

const geometryToPolygons = (geom: Geometry): Polygon[] => {
    const type = geom.getType();
    if (type === 'Polygon') return [geom as Polygon];
    if (type === 'MultiPolygon') return (geom as MultiPolygon).getPolygons();
    if (type === 'GeometryCollection') {
        const out: Polygon[] = [];
        for (const inner of (geom as GeometryCollection).getGeometries()) {
            out.push(...geometryToPolygons(inner));
        }
        return out;
    }
    return [];
};

// Returns polygon features. Handles POLYGON, MULTIPOLYGON, and GEOMETRYCOLLECTION-wrapped variants.
const readPolygonFeatures = (wkt: string): Feature[] => {
    if (!wkt?.trim()) return [];
    try {
        const feature = wktFormat.readFeature(wkt, {
            dataProjection: DATA_PROJ,
            featureProjection: FEATURE_PROJ,
        }) as Feature;
        const geom = feature.getGeometry();
        if (!geom) return [];
        const polygons = geometryToPolygons(geom);
        return polygons.map(p => new Feature({ geometry: p }));
    } catch {
        return [];
    }
};

const writeWKTFromFeature = (feature: Feature): string =>
    wktFormat.writeFeature(feature, {
        dataProjection: DATA_PROJ,
        featureProjection: FEATURE_PROJ,
        decimals: 8,
    });

const WKTPolygonMap: React.FC<WKTPolygonMapProps> = ({
    value,
    onChange,
    readOnly = false,
    center,
    height = 400,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const sourceRef = useRef<VectorSource | null>(null);
    const lastSourceWKTRef = useRef<string>('');
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [inputValue, setInputValue] = useState<string>(value ?? '');
    const [inputError, setInputError] = useState<boolean>(false);
    const inputFocusedRef = useRef<boolean>(false);

    useEffect(() => {
        if (inputFocusedRef.current) return;
        const next = value ?? '';
        setInputValue(next);
        setInputError(!!next.trim() && readPolygonFeatures(next).length === 0);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const next = e.target.value;
        setInputValue(next);
        if (!next.trim()) {
            setInputError(false);
            onChange('');
            return;
        }
        const features = readPolygonFeatures(next);
        if (features.length !== 1) {
            setInputError(true);
            return;
        }
        setInputError(false);
        const canonical = writeWKTFromFeature(features[0]);
        onChange(canonical);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const source = new VectorSource();
        sourceRef.current = source;

        const hasCenter = center && center.lat != null && center.long != null;
        const view = new View({
            center: fromLonLat(
                hasCenter ? [center!.long as number, center!.lat as number] : DEFAULT_CENTER
            ),
            zoom: hasCenter ? 14 : DEFAULT_ZOOM,
        });

        const map = new Map({
            target: containerRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                new VectorLayer({ source }),
            ],
            view,
        });
        mapRef.current = map;

        const ro = new ResizeObserver(() => map.updateSize());
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            map.setTarget(undefined);
            mapRef.current = null;
            sourceRef.current = null;
        };
    }, []);

    const fitToSource = () => {
        const source = sourceRef.current;
        const map = mapRef.current;
        if (!source || !map) return;
        const features = source.getFeatures();
        if (!features.length) return;
        const combined: Extent = createEmpty();
        for (const f of features) {
            const ext = f.getGeometry()?.getExtent();
            if (ext) extend(combined, ext);
        }
        if (isEmpty(combined)) return;
        map.getView().fit(combined, { padding: [40, 40, 40, 40], maxZoom: 18 });
    };

    useEffect(() => {
        const source = sourceRef.current;
        if (!source) return;
        if (value === lastSourceWKTRef.current) return;

        source.clear();
        const features = readPolygonFeatures(value);
        for (const f of features) source.addFeature(f);
        if (features.length) fitToSource();
        lastSourceWKTRef.current = value ?? '';
    }, [value]);

    useEffect(() => {
        const map = mapRef.current;
        const source = sourceRef.current;
        if (!map || !source || readOnly) return;

        const modify = new Modify({ source });
        const draw = new Draw({ source, type: 'Polygon' });
        const snap = new Snap({ source });

        draw.on('drawstart', () => {
            source.clear();
        });

        draw.on('drawend', (e) => {
            const wkt = writeWKTFromFeature(e.feature as Feature);
            lastSourceWKTRef.current = wkt;
            onChangeRef.current(wkt);
        });

        modify.on('modifyend', () => {
            const features = source.getFeatures();
            if (!features.length) return;
            const wkt = writeWKTFromFeature(features[0]);
            lastSourceWKTRef.current = wkt;
            onChangeRef.current(wkt);
        });

        map.addInteraction(modify);
        map.addInteraction(draw);
        map.addInteraction(snap);

        return () => {
            map.removeInteraction(modify);
            map.removeInteraction(draw);
            map.removeInteraction(snap);
        };
    }, [readOnly]);

    const handleClear = () => {
        sourceRef.current?.clear();
        lastSourceWKTRef.current = '';
        onChange('');
    };

    return (
        <Stack spacing={1}>
            <Box
                ref={containerRef}
                sx={{
                    width: '100%',
                    height,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            />
            <Stack direction="row" spacing={1}>
                <Tooltip title="Center map on polygon">
                    <span>
                        <Button
                            size="small"
                            startIcon={<CenterFocusStrongIcon />}
                            onClick={fitToSource}
                            disabled={!value}
                        >
                            Center on polygon
                        </Button>
                    </span>
                </Tooltip>
                {!readOnly && (
                    <Button
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={handleClear}
                        disabled={!value}
                    >
                        Clear polygon
                    </Button>
                )}
            </Stack>
            <TextField
                label="WKT"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => { inputFocusedRef.current = true; }}
                onBlur={() => {
                    inputFocusedRef.current = false;
                    if (inputError || !inputValue.trim()) {
                        setInputValue(value ?? '');
                        setInputError(false);
                    }
                }}
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                slotProps={{ input: { readOnly: readOnly } }}
                placeholder="Draw a polygon on the map or paste WKT here"
                size="small"
                error={inputError}
                helperText={inputError ? 'Invalid WKT polygon' : ' '}
            />
        </Stack>
    );
};

export default WKTPolygonMap;
