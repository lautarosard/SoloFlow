import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, useNavigate, useRouteError } from 'react-router';
import { AppShell } from './layout/AppShell';
import { EmptyState, SkeletonList } from '../components/ui/States';
import { Button } from '../components/ui/Button';

const CapturePage = lazy(() => import('../features/capture/CapturePage'));
const TriagePage = lazy(() => import('../features/triage/TriagePage'));
const ComposerPage = lazy(() => import('../features/composer/ComposerPage'));
const DispatchPage = lazy(() => import('../features/dispatch/DispatchPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));

const page = (element: ReactNode) => <Suspense fallback={<SkeletonList rows={4} />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/capture" replace /> },
      { path: 'capture', element: page(<CapturePage />) },
      { path: 'triage', element: page(<TriagePage />) },
      { path: 'composer', element: page(<ComposerPage />) },
      { path: 'dispatch/:reportId', element: page(<DispatchPage />) },
      { path: 'reports', element: page(<ReportsPage />) },
      { path: 'clients', element: page(<ClientsPage />) },
      { path: 'settings', element: page(<SettingsPage />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState
      title="Página no encontrada"
      description="La ruta que buscás no existe."
      action={
        <Button variant="primary" onClick={() => navigate('/capture')}>
          Ir a Captura
        </Button>
      }
    />
  );
}

function RouteError() {
  const error = useRouteError();
  return (
    <div className="mx-auto max-w-lg p-8">
      <EmptyState
        title="Algo salió mal"
        description={error instanceof Error ? error.message : 'Error inesperado'}
        action={
          <Button variant="primary" onClick={() => window.location.assign('/capture')}>
            Volver al inicio
          </Button>
        }
      />
    </div>
  );
}
