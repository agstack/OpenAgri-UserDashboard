import { alpha, Box, IconButton, InputAdornment, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LaunchIcon from '@mui/icons-material/Launch';
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { FarmParcelModel } from "@models/FarmParcel";
import { ParcelSelectionListProps } from "./ParcelSelectionList.types";

import ParcelThumbnail from "@components/shared/ParcelThumbnail/ParcelThumbnail";

interface FarmHeaderItem {
    type: 'farm-header';
    farmId: string;
    farmName: string;
    parcelCount: number;
    collapsed: boolean;
}

interface ParcelRowItem {
    type: 'parcel';
    parcel: FarmParcelModel;
}

type Item = FarmHeaderItem | ParcelRowItem;

const ROW_HEIGHT_DESKTOP = 112;
const ROW_HEIGHT_MOBILE = 80;
const HEADER_HEIGHT = 56;
const LIST_HEIGHT_DESKTOP = 480;
const LIST_HEIGHT_MOBILE = 360;

const UNKNOWN_FARM = '__unknown__';

const matchesSearch = (p: FarmParcelModel, q: string, farmName: string): boolean => {
    if (!q) return true;
    const hay = [
        p.identifier, p.category, p.inRegion, p.hasToponym, p.description, farmName,
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
};

const ParcelSelectionList: React.FC<ParcelSelectionListProps> = ({ parcels, selectedParcelId, f, farmNamesById = {} }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const ROW_HEIGHT = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP;
    const LIST_HEIGHT = isMobile ? LIST_HEIGHT_MOBILE : LIST_HEIGHT_DESKTOP;
    const [search, setSearch] = useState<string>('');
    const [collapsedFarms, setCollapsedFarms] = useState<Set<string>>(new Set());
    const listRef = useRef<VariableSizeList>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleFarm = (id: string) => {
        setCollapsedFarms(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const items = useMemo<Item[]>(() => {
        const grouped = new Map<string, FarmParcelModel[]>();
        for (const p of parcels) {
            const fid = p.farm?.["@id"] ?? UNKNOWN_FARM;
            const farmName = fid === UNKNOWN_FARM ? '(no farm)' : (farmNamesById[fid] ?? 'Unknown farm');
            if (!matchesSearch(p, search, farmName)) continue;
            if (!grouped.has(fid)) grouped.set(fid, []);
            grouped.get(fid)!.push(p);
        }

        const sortedFarmIds = Array.from(grouped.keys()).sort((a, b) => {
            const na = a === UNKNOWN_FARM ? '' : (farmNamesById[a] ?? a);
            const nb = b === UNKNOWN_FARM ? '' : (farmNamesById[b] ?? b);
            return na.localeCompare(nb);
        });

        const out: Item[] = [];
        const isSearching = !!search.trim();
        for (const fid of sortedFarmIds) {
            const collapsed = !isSearching && collapsedFarms.has(fid);
            const farmName = fid === UNKNOWN_FARM ? '(no farm)' : (farmNamesById[fid] ?? 'Unknown farm');
            const farmParcels = grouped.get(fid)!;
            out.push({
                type: 'farm-header',
                farmId: fid,
                farmName,
                parcelCount: farmParcels.length,
                collapsed,
            });
            if (!collapsed) {
                for (const p of farmParcels) {
                    out.push({ type: 'parcel', parcel: p });
                }
            }
        }
        return out;
    }, [parcels, search, collapsedFarms, farmNamesById]);

    const getItemSize = (index: number) => items[index].type === 'farm-header' ? HEADER_HEIGHT : ROW_HEIGHT;

    useEffect(() => {
        listRef.current?.resetAfterIndex(0);
    }, [items]);

    const Row = ({ index, style }: ListChildComponentProps) => {
        const item = items[index];
        if (item.type === 'farm-header') {
            return (
                <Box
                    style={style}
                    onClick={() => toggleFarm(item.farmId)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        padding: 1.5,
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        width: '100%',
                        overflow: 'hidden',
                        backgroundColor: theme.palette.background.default,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                >
                    {item.collapsed ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flex: 1, minWidth: 0 }} noWrap>
                        {item.farmName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                        {item.parcelCount} parcel{item.parcelCount === 1 ? '' : 's'}
                    </Typography>
                </Box>
            );
        }

        const p = item.parcel;
        const isSelected = p["@id"] === selectedParcelId;
        const depictionUrl = (p.depiction || '').trim();
        const wkt = p.hasGeometry?.asWKT || '';
        const thumbSize = isMobile ? 56 : 80;
        return (
            <Box style={style} sx={{ padding: 0.5, boxSizing: 'border-box', width: '100%' }}>
                <Box
                    onClick={() => f(p)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: { xs: 1, sm: 2 },
                        boxShadow: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        height: '100%',
                        boxSizing: 'border-box',
                        width: '100%',
                        overflow: 'hidden',
                        transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
                        '&:hover': {
                            backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.2) : alpha('rgb(0, 0, 0)', 0.04),
                        }
                    }}
                >
                    <ParcelThumbnail
                        depictionUrl={depictionUrl}
                        wkt={wkt}
                        identifier={p.identifier}
                        size={thumbSize}
                        sx={{ marginRight: { xs: 1, sm: 2 } }}
                    />
                    <Box sx={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }} noWrap>
                            {p.identifier}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {[p.category, p.inRegion].filter(Boolean).join(' · ') || p["@type"]}
                        </Typography>
                    </Box>
                    <Tooltip title="Open parcel details">
                        <IconButton
                            size="small"
                            aria-label="Open parcel details"
                            onClick={(e) => {
                                e.stopPropagation();
                                const parcelId = p["@id"].split(':')[3];
                                if (parcelId) navigate(`/farm-locations/farm-parcel/${parcelId}`, {
                                    state: { from: location.pathname + location.search }
                                });
                            }}
                            sx={{ ml: 1, flexShrink: 0 }}
                        >
                            <LaunchIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        );
    };

    if (parcels.length === 0) {
        return <Typography color="text.secondary">No parcels available.</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <TextField
                size="small"
                placeholder="Search by identifier, region, category, toponym, farm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: search ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearch('')} aria-label="clear">
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                    }
                }}
            />
            {items.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>No matching parcels.</Typography>
            ) : (
                <VariableSizeList
                    ref={listRef}
                    height={Math.min(LIST_HEIGHT, items.reduce((acc, _, i) => acc + getItemSize(i), 0))}
                    itemCount={items.length}
                    itemSize={getItemSize}
                    width="100%"
                    style={{ overflowX: 'hidden' }}
                >
                    {Row}
                </VariableSizeList>
            )}
        </Box>
    );
};

export default ParcelSelectionList;
