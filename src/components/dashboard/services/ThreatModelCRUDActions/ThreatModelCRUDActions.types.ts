import { Crop } from "@models/Crop";
import { ThreatModel } from "@models/ThreatModel";

export interface ThreatModelCRUDActionsProps {
    threatModel?: ThreatModel;
    crops: Crop[];
    onAction?: () => void;
    canEdit: boolean;
    canDelete: boolean;
}
