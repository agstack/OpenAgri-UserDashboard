interface GenericSelectPropsBase<T, R = T[]> {
    endpoint: string;
    data?: R;
    label: string;
    method?: "GET" | "OPTIONS";
    canEdit?: boolean;
    getOptionLabel: (item: T) => string;
    getOptionValue: (item: T) => string;
    transformResponse?: (response: R) => T[];
    error?: boolean;
    required?: boolean;
    helperText?: string;
}

// Props for a SINGLE select (multiple is false or undefined)
type GenericSelectPropsSingle<T, R = T[]> = GenericSelectPropsBase<T, R> & {
    multiple?: false;
    selectedValue: string | undefined;
    setSelectedValue: React.Dispatch<React.SetStateAction<string>>;
};

// Props for a MULTI select (multiple is true)
type GenericSelectPropsMultiple<T, R = T[]> = GenericSelectPropsBase<T, R> & {
    multiple: true;
    selectedValue: string[] | undefined;
    setSelectedValue: React.Dispatch<React.SetStateAction<string[]>>;
};

export type GenericSelectProps<T, R = T[]> =
    | GenericSelectPropsSingle<T, R>
    | GenericSelectPropsMultiple<T, R>;