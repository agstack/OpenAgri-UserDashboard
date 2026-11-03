import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Outlet } from 'react-router';
import type { Navigation } from '@toolpad/core';
import { theme } from '@theme/theme';

import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import PestControlIcon from '@mui/icons-material/PestControl';
import AssessmentIcon from '@mui/icons-material/Assessment'; // TODO: possibly change to something else
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { useEffect, useState, useMemo } from 'react';
import SessionContext, { Session } from '@contexts/SessionContext';
import { Folder } from '@mui/icons-material';
import FenceIcon from '@mui/icons-material/Fence';
import MapIcon from '@mui/icons-material/Map';
// import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CompostIcon from '@mui/icons-material/Compost';
import CrueltyFreeIcon from '@mui/icons-material/CrueltyFree';
import ReportIcon from '@mui/icons-material/Report';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import GrassIcon from '@mui/icons-material/Grass';
import YardIcon from '@mui/icons-material/Yard';
import TerrainIcon from '@mui/icons-material/Terrain';
import PetsIcon from '@mui/icons-material/Pets';
import AgricultureIcon from '@mui/icons-material/Agriculture';

const BRANDING = {
  logo: <img className='' src="/logo-color.png" alt="" />,
  title: ''
};

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const storedSession = localStorage.getItem("session");
    return storedSession ? JSON.parse(storedSession) : null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('session', JSON.stringify(session));
    } else {
      localStorage.removeItem('session');
    }
  }, [session]);

  const navigation = useMemo(() => {
    const hasAccess = (code: string) => {
      if (!session || !session.services) return false;
      const service = session.services.find(s => s.code === code);
      return service ? service.actions.includes('view') : false;
    };

    const hasAccessIrriUploadDataset = () => {
      if (!session || !session.services) return false;
      const service = session.services.find(s => s.code === 'IRM');
      return service ? service.actions.includes('add') : false;
    }

    const nav: any[] = [
      {
        kind: 'header',
        title: 'Home page',
      },
      {
        segment: '',
        title: 'OpenAgri Dashboard',
        icon: <HomeIcon />,
      },
      {
        kind: 'header',
        title: 'Farm calendar',
      },
      {
        segment: 'farm-calendar',
        title: 'Farm calendar',
        icon: <CalendarMonthIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'farm-locations',
        title: 'Farm locations',
        icon: <Folder />,
        disabled: !hasAccess('FC'),
        children: [
          {
            segment: 'farms',
            title: 'Farms',
            icon: <FenceIcon />,
            disabled: !hasAccess('FC'),
          },
          {
            segment: 'farm-parcels',
            title: 'Farm parcels',
            icon: <MapIcon />,
            disabled: !hasAccess('FC'),
          }
        ]
      },
      {
        segment: 'farm-animals',
        title: 'Farm animals',
        icon: <PetsIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'agricultural-machines',
        title: 'Agricultural machines',
        icon: <AgricultureIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'farm-crops',
        title: 'Crops',
        icon: <GrassIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'fertilizers',
        title: 'Fertilizers',
        icon: <YardIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'pesticides',
        title: 'Pesticides',
        icon: <PestControlIcon />,
        disabled: !hasAccess('FC'),
      },
      {
        segment: 'reporting-service',
        title: 'Reporting service',
        icon: <AssessmentIcon />,
        disabled: !hasAccess('RP'),
        children: [
          {
            segment: 'compost-operations',
            title: 'Compost operations',
            icon: <CompostIcon />,
            disabled: !hasAccess('RP'),
          },
          {
            segment: 'farm-animals',
            title: 'Farm animals report',
            icon: <CrueltyFreeIcon />,
            disabled: !hasAccess('RP'),
          },
          {
            segment: 'irrigation-operations',
            title: 'Irrigation operations',
            icon: <WaterDropIcon />,
            disabled: !hasAccess('RP'),
          },
          {
            segment: 'field-notebook',
            title: 'Field notebook',
            icon: <NoteAddIcon />,
            disabled: !hasAccess('RP'),
          },
        ]
      },
      {
        kind: 'header',
        title: 'Irrigation management',
      },
      {
        segment: 'eto-calculator',
        title: 'ETo Calculator',
        icon: <TimelineIcon />,
        disabled: !hasAccess('IRM'),
      },
      {
        segment: 'upload-dataset',
        title: 'Upload Dataset',
        icon: <NoteAddIcon />,
        disabled: !hasAccess('IRM') || !hasAccessIrriUploadDataset(),
      },
      {
        segment: 'soil-moisture-analysis',
        title: 'Soil Moisture Analysis',
        icon: <AnalyticsIcon />,
        disabled: !hasAccess('IRM'),
      },
      {
        segment: 'soil-types',
        title: 'Soil types',
        icon: <TerrainIcon />,
        disabled: !hasAccess('IRM'),
      },
      {
        kind: 'header',
        title: 'Pest and disease management',
      },
      {
        segment: 'pests',
        title: 'Pests',
        icon: <PestControlIcon />,
        disabled: !hasAccess('PDM'),
      },
      {
        segment: 'gdd',
        title: 'Growing degree days',
        icon: <GrassIcon />,
        disabled: !hasAccess('PDM'),
      },
      {
        segment: 'threat-models',
        title: 'Threat models',
        icon: <CoronavirusIcon />,
        disabled: !hasAccess('PDM'),
      },
      {
        segment: 'risk-forecast',
        title: 'Risk forecast',
        icon: <ReportIcon />,
        disabled: !hasAccess('PDM'),
      },
      {
        kind: 'header',
        title: 'Weather data',
      },
      {
        segment: 'weather-data',
        title: 'Weather data',
        icon: <ThermostatIcon />,
        disabled: !hasAccess('WD'),
      },
    ];

    return nav as Navigation;
  }, [session]);

  return (
    <ReactRouterAppProvider theme={theme} navigation={navigation} branding={BRANDING}>
      <SessionContext.Provider value={{ session, setSession }}>
        <Outlet />
      </SessionContext.Provider>
    </ReactRouterAppProvider>
  );
}