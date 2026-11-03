import { Outlet, useOutletContext } from 'react-router';
import { useSession, ServiceActions } from '@contexts/SessionContext';
import { DashboardContextType } from '@layouts/dashboard';

export type ServiceContextType = DashboardContextType & {
  actions: ServiceActions[];
};

export default function ReportingLayout() {
  const { session } = useSession();
  const context = useOutletContext<DashboardContextType>();
  
  const service = session?.services?.find(s => s.code === 'RP');
  const actions = service?.actions || [];

  return <Outlet context={{ ...context, actions } as ServiceContextType} />;
}
