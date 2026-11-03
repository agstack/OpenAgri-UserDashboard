export type Order = 'asc' | 'desc';

export interface HeadCell<T> {
    id: keyof T;
    label: string;
    numeric: boolean;
    disableSort?: boolean;
    renderCell?: (row: T) => React.ReactNode;
}

export interface EnhancedTableHeadProps<T> {
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof T) => void;
    order: Order;
    orderBy: keyof T | null;
    headCells: readonly HeadCell<T>[];
}

export interface GenericSortableTableProps<T> {
    data: readonly T[];
    headCells: readonly HeadCell<T>[];
    onRowClick?: (row: T) => void;
}