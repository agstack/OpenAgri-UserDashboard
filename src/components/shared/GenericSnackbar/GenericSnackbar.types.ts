type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface GenericSnackbarProps {
    type: SnackbarType;
    message: string;
    open: boolean;
    onClose: () => void;
}