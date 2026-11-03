import { BaseActivityModel } from "@models/FarmCalendarActivities";
import { FarmCalendarActivityTypeModel } from "@models/FarmCalendarActivityType";

export interface ActivityDynamicCRUDActionsProps<T extends BaseActivityModel> {
    activity: T;
    activityTypes: FarmCalendarActivityTypeModel[];
    onSave?: (activityToSave: BaseActivityModel) => void;
    onAdd?: (activityToSave: BaseActivityModel) => void;
    onDelete?: () => void;
    loading: boolean;
    canEdit: boolean;
    canDelete: boolean;
}