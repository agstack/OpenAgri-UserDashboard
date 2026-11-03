import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router';

import Redirect from '@components/shared/Redirect/Redirect.tsx';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import DashLayout from './layouts/dashboard.tsx';
import LandingPage from '@pages/dashboard/LandingPage/LandingPage.tsx';
import FarmCalendarPage from '@pages/dashboard/services/FarmCalendar/FarmCalendar.tsx';
// import WKTInputPage from '@pages/dashboard/services/Irrigation/WKTInput.tsx';
import GrowingDegreeDaysPage from '@pages/dashboard/services/PestAndDisease/GrowingDegreeDays.tsx';
import CompostOperationsReportPage from '@pages/dashboard/services/FarmCalendar/ReportingService/CompostOperations.tsx';
import AuthLayout from '@layouts/auth.tsx';
import SignInPage from '@pages/auth/SignIn/SignInPage.tsx';
import SignUpPage from '@pages/auth/SignUp/SignUpPage.tsx';
import FarmParcelPage from '@pages/dashboard/services/FarmCalendar/FarmLocations/FarmParcel.tsx';
import FarmParcelsPage from '@pages/dashboard/services/FarmCalendar/FarmLocations/FarmParcels.tsx';
import FarmsPage from '@pages/dashboard/services/FarmCalendar/FarmLocations/Farms.tsx';
import FarmPage from '@pages/dashboard/services/FarmCalendar/FarmLocations/Farm.tsx';
import TokenRefreshPage from '@pages/auth/TokenRefresh/TokenRefresh.tsx';
import RegisterCalendarActivityPage from '@pages/dashboard/services/FarmCalendar/FarmCalendarActivities/RegisterActivity.tsx';
import EditCalendarActivityPage from '@pages/dashboard/services/FarmCalendar/FarmCalendarActivities/EditActivity.tsx';
import ActivityTypesPage from '@pages/dashboard/services/FarmCalendar/ActivityTypes/ActivityTypes.tsx';
import AddActivityTypePage from '@pages/dashboard/services/FarmCalendar/ActivityTypes/AddActivityType.tsx';
import EditActivityTypePage from '@pages/dashboard/services/FarmCalendar/ActivityTypes/EditActivityType.tsx';
import FarmAnimalsPage from '@pages/dashboard/services/FarmCalendar/FarmAnimals/FarmAnimals.tsx';
import EditFarmAnimalPage from '@pages/dashboard/services/FarmCalendar/FarmAnimals/EditFarmAnimal.tsx';
import AgriculturalMachinesPage from '@pages/dashboard/services/FarmCalendar/AgriculturalMachines/AgriculturalMachines.tsx';
import EditAgriculturalMachinePage from '@pages/dashboard/services/FarmCalendar/AgriculturalMachines/EditAgriculturalMachine.tsx';
import FarmCropsPage from '@pages/dashboard/services/FarmCalendar/FarmCrops/FarmCrops.tsx';
import EditFarmCropPage from '@pages/dashboard/services/FarmCalendar/FarmCrops/EditFarmCrop.tsx';
import FertilizersPage from '@pages/dashboard/services/FarmCalendar/Fertilizers/Fertilizers.tsx';
import EditFertilizerPage from '@pages/dashboard/services/FarmCalendar/Fertilizers/EditFertilizer.tsx';
import PesticidesPage from '@pages/dashboard/services/FarmCalendar/Pesticides/Pesticides.tsx';
import EditPesticidePage from '@pages/dashboard/services/FarmCalendar/Pesticides/EditPesticide.tsx';
import WeatherDataPage from '@pages/dashboard/services/WeatherData/WeatherData.tsx';
import EToCalculatorPage from '@pages/dashboard/services/Irrigation/EToCalculator.tsx';
import UploadDatasetPage from '@pages/dashboard/services/Irrigation/UploadDataset.tsx';
import SoilMoistureAnalysisPage from '@pages/dashboard/services/Irrigation/SoilMoistureAnalysis.tsx';
import SoilTypesPage from '@pages/dashboard/services/Irrigation/SoilTypes.tsx';
import EditSoilTypePage from '@pages/dashboard/services/Irrigation/EditSoilType.tsx';
import IrrigationOperationsReportPage from '@pages/dashboard/services/FarmCalendar/ReportingService/IrrigationOperations.tsx';
import FarmAnimalsReportPage from '@pages/dashboard/services/FarmCalendar/ReportingService/FarmAnimals.tsx';
import FieldNotebookReportPage from '@pages/dashboard/services/FarmCalendar/ReportingService/FieldNotebook.tsx';
import PestsPage from '@pages/dashboard/services/PestAndDisease/Pests.tsx';
import ThreatModelsPage from '@pages/dashboard/services/PestAndDisease/ThreatModels.tsx';
import RiskForecastPage from '@pages/dashboard/services/PestAndDisease/RiskForecast.tsx';

import FarmCalendarLayout from './layouts/services/FarmCalendarLayout.tsx';
import IrrigationManagementLayout from './layouts/services/IrrigationManagementLayout.tsx';
import PestAndDiseaseLayout from './layouts/services/PestAndDiseaseLayout.tsx';
import ReportingLayout from './layouts/services/ReportingLayout.tsx';
import WeatherDataLayout from './layouts/services/WeatherDataLayout.tsx';

const router = createBrowserRouter([
  {
    Component: App,
    children: [
      {
        path: '/',
        Component: DashLayout,
        children: [
          {
            path: '',
            Component: LandingPage
          },
          /** Farm calendar */
          {
            Component: FarmCalendarLayout,
            children: [
              {
                path: 'farm-calendar',
                Component: FarmCalendarPage,
              },
              {
                path: 'farm-calendar/register-activity',
                Component: RegisterCalendarActivityPage
              },
              {
                path: 'farm-calendar/edit-activity/:id',
                Component: EditCalendarActivityPage
              },
              {
                path: 'farm-calendar/activity-types',
                Component: ActivityTypesPage
              },
              {
                path: 'farm-calendar/activity-types/add',
                Component: AddActivityTypePage
              },
              {
                path: 'farm-calendar/activity-types/edit/:id',
                Component: EditActivityTypePage
              },
              {
                path: 'farm-animals',
                Component: FarmAnimalsPage
              },
              {
                path: 'farm-animals/:id',
                Component: EditFarmAnimalPage
              },
              {
                path: 'agricultural-machines',
                Component: AgriculturalMachinesPage
              },
              {
                path: 'agricultural-machines/:id',
                Component: EditAgriculturalMachinePage
              },
              {
                path: 'farm-crops',
                Component: FarmCropsPage
              },
              {
                path: 'farm-crops/:id',
                Component: EditFarmCropPage
              },
              {
                path: 'fertilizers',
                Component: FertilizersPage
              },
              {
                path: 'fertilizers/:id',
                Component: EditFertilizerPage
              },
              {
                path: 'pesticides',
                Component: PesticidesPage
              },
              {
                path: 'pesticides/:id',
                Component: EditPesticidePage
              },
              {
                path: 'farm-locations',
                children: [
                  {
                    index: true,
                    element: <Redirect to='farm-locations/farms' />,
                  },
                  {
                    path: 'farms',
                    Component: FarmsPage
                  },
                  {
                    path: 'farm/:id',
                    Component: FarmPage
                  },
                  {
                    path: 'farm-parcels',
                    Component: FarmParcelsPage
                  },
                  {
                    path: 'farm-parcel/:id',
                    Component: FarmParcelPage
                  },
                ]
              },
            ]
          },
          /** End of Farm calendar */
          {
            Component: ReportingLayout,
            children: [
              {
                path: 'reporting-service',
                children: [
                  {
                    index: true,
                    element: <Redirect to='reporting-service/compost-operations' />,
                  },
                  {
                    path: 'compost-operations',
                    Component: CompostOperationsReportPage
                  },
                  {
                    path: 'farm-animals',
                    Component: FarmAnimalsReportPage
                  },
                  {
                    path: 'irrigation-operations',
                    Component: IrrigationOperationsReportPage
                  },
                  {
                    path: 'field-notebook',
                    Component: FieldNotebookReportPage
                  },
                ]
              },
            ]
          },
          {
            Component: IrrigationManagementLayout,
            children: [
              {
                path: 'eto-calculator',
                Component: EToCalculatorPage
              },
              {
                path: 'upload-dataset',
                Component: UploadDatasetPage
              },
              {
                path: 'soil-moisture-analysis',
                Component: SoilMoistureAnalysisPage
              },
              {
                path: 'soil-types',
                Component: SoilTypesPage
              },
              {
                path: 'soil-types/:id',
                Component: EditSoilTypePage
              },
            ]
          },
          {
            Component: PestAndDiseaseLayout,
            children: [
              {
                path: 'pests',
                Component: PestsPage
              },
              {
                path: 'gdd',
                Component: GrowingDegreeDaysPage
              },
              {
                path: 'threat-models',
                Component: ThreatModelsPage
              },
              {
                path: 'risk-forecast',
                Component: RiskForecastPage
              },
            ]
          },
          {
            Component: WeatherDataLayout,
            children: [
              {
                path: 'weather-data',
                Component: WeatherDataPage
              },
            ]
          },
        ]
      },
      {
        path: '/',
        Component: AuthLayout,
        children: [
          {
            path: 'sign-in',
            Component: SignInPage
          },
          {
            path: 'sign-up',
            Component: SignUpPage
          },
          {
            path: 'session-refresh',
            Component: TokenRefreshPage
          }
        ]
      },
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <RouterProvider router={router} />
    </LocalizationProvider>
  </StrictMode>,
)
