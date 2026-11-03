import { Outlet, useLocation, useNavigate } from 'react-router';
import { DashboardLayout, DashboardSidebarPageItem } from '@toolpad/core/DashboardLayout';
import type { NavigationPageItem } from '@toolpad/core/AppProvider';
import { Breadcrumb, PageContainer } from '@toolpad/core/PageContainer';
import ToolbarActions from '@components/dashboard/ToolbarActions/ToolbarActions';
import { useSession } from '@contexts/SessionContext';
import Redirect from '@components/shared/Redirect/Redirect';
import { jwtDecode } from 'jwt-decode';
import Footer from '@components/shared/Footer';
import { useEffect, useState, useCallback } from 'react';
import useFetch from '@hooks/useFetch';
import { clearUserCaches } from '@utils/pwaCache';

export type DashboardContextType = {
  setPageTitle: (title: string | undefined) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[] | undefined) => void;
};

export default function DashLayout() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const [pageTitle, setPageTitle] = useState<string | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[] | undefined>(undefined);

  const { fetchData, response, error } = useFetch<any>(
    "me/",
    {
      method: 'GET',
    }
  );

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (session && response) {
      setSession(prevSession => {
        if (prevSession) {
          return {
            ...prevSession,
            services: response.services
          };
        }
        return null;
      });
    }
  }, [response])

  useEffect(() => {
    if (error) {
      if (!navigator.onLine) return;
      clearUserCaches().finally(() => {
        setSession(null);
        navigate("/");
      });
    }
  }, [error])

  const renderPageItem = useCallback(
    (item: NavigationPageItem) => {
      if ((item as any).disabled) {
        return <DashboardSidebarPageItem item={item} disabled />;
      }
      return <DashboardSidebarPageItem item={item} />;
    },
    [],
  );

  const callbackURL =
    `?callbackURL=${encodeURIComponent(location.pathname)}`;

  if (!session || !session.user || !session.user.token) {
    return <Redirect to={'/sign-in' + callbackURL} />;
  } else {
    try {
      // Decode the token to get its payload
      const decodedToken = jwtDecode(session.user.token);

      if ((decodedToken.exp ?? 0) < Date.now() / 1000) {
        if (navigator.onLine) {
          return <Redirect to={'/session-refresh' + callbackURL} />;
        }
      }
    } catch (error) {
      // Token is invalid; redirect to sign-in
      return <Redirect to={'/sign-in' + callbackURL} />;
    }
  }

  return (
    <DashboardLayout
      renderPageItem={renderPageItem}
      slots={{
        toolbarActions: ToolbarActions
      }}
    >
      <PageContainer title={pageTitle} breadcrumbs={breadcrumbs}>
        <Outlet context={{ setPageTitle, setBreadcrumbs }} />
      </PageContainer>
      <Footer />
    </DashboardLayout>
  );
}