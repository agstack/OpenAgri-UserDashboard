import { FarmParcelModel } from "@models/FarmParcel";
import { createContext, useContext } from "react";

export type ServiceActions = 'add' | 'delete' | 'edit' | 'view';
export interface Session {
    user: {
        token?: string;
        refresh_token?: string;
    };
    farm_parcel?: FarmParcelModel;
    services?: {
        code: string;
        actions: ServiceActions[];
    }[]
}

interface SessionContextType {
    session: Session | null;
    setSession: React.Dispatch<React.SetStateAction<Session | null>>;
}

const SessionContext = createContext<SessionContextType>({
    session: null,
    setSession: () => { },
});

export default SessionContext;

export const useSession = () => useContext(SessionContext);