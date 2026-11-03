import { FarmParcelModel } from "@models/FarmParcel";

export interface ParcelSelectionListProps {
    parcels: FarmParcelModel[];
    selectedParcelId?: string;
    f: (parcel?: FarmParcelModel) => void;
    farmNamesById?: Record<string, string>;
}
