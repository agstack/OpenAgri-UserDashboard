import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectChangeEvent, Chip } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { GenericSelectProps } from './GenericSelect.types';
import useFetch from '@hooks/useFetch';

const GenericSelect = <T, R = T[]>({
    endpoint,
    label,
    method = "GET",
    getOptionLabel,
    getOptionValue,
    selectedValue,
    setSelectedValue,
    transformResponse,
    canEdit = true,
    data = undefined,
    multiple = false,
    error = false,
    required = false,
    helperText,
}: GenericSelectProps<T, R>) => {
    const { fetchData, response, loading } = useFetch<R>(endpoint, { method: method });

    const handleChange = (event: SelectChangeEvent<any>) => {
        const { target: { value } } = event;
        setSelectedValue(value as any);
    };

    useEffect(() => {
        if (!data) fetchData();
    }, [endpoint, method]);

    const items = useMemo(() => {
        const dataToUse = data ? data : response;
        return dataToUse && transformResponse ? transformResponse(dataToUse) : (dataToUse || []) as T[]
    }, [data, response, transformResponse]);

    const valueToRender = useMemo(() => {
        if (loading) {
            return multiple ? [] : '';
        }

        if (multiple) {
            const selected = selectedValue as string[] | undefined ?? [];
            if (items.length === 0 && selected.length > 0) return [];
            const validValues = selected.filter(val =>
                items.some(item => getOptionValue(item) === val)
            );
            return validValues;
        } else {
            const selected = selectedValue as string | undefined ?? '';
            if (items.length === 0 && selected) return '';
            const isValid = items.some(item => getOptionValue(item) === selected);
            return isValid ? selected : '';
        }
    }, [loading, multiple, selectedValue, items, getOptionValue]);

    return (
        <Box flex={1}>
            <FormControl fullWidth error={error} required={required}>
                <InputLabel id={`${label}-label`}>{label}</InputLabel>
                <Select
                    readOnly={!canEdit}
                    labelId={`${label}-label`}
                    value={valueToRender}
                    label={label}
                    disabled={loading}
                    onChange={handleChange}
                    multiple={multiple}
                    error={error}
                    renderValue={multiple ? (selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => {
                                const item = Array.isArray(items)
                                    ? items.find(i => getOptionValue(i) === value)
                                    : null;
                                const itemLabel = item ? getOptionLabel(item) : value;
                                return (
                                    <Chip
                                        key={value}
                                        label={itemLabel}
                                        onMouseDown={canEdit ? (e) => e.stopPropagation() : undefined}
                                        onDelete={canEdit ? () => {
                                            (setSelectedValue as React.Dispatch<React.SetStateAction<string[]>>)(prev =>
                                                (prev ?? []).filter(v => v !== value)
                                            );
                                        } : undefined}
                                    />
                                );
                            })}
                        </Box>
                    ) : undefined}
                >
                    {!multiple && (
                        <MenuItem key="empty" value="">
                            <em>Please select an option</em>
                        </MenuItem>
                    )}

                    {Array.isArray(items) &&
                        items.map((item, index) => {
                            const itemValue = getOptionValue(item);
                            const key = `${itemValue}-${index}`;
                            return (
                                <MenuItem key={key} value={itemValue}>
                                    {getOptionLabel(item)}
                                </MenuItem>
                            );
                        })}
                </Select>
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
            </FormControl>
        </Box>
    );
};

export default GenericSelect;