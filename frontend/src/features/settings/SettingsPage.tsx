import { Settings } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Ajustes" description="Perfil y preferencias." />
      <EmptyState icon={<Settings />} title="En construcción" description="Esta vista llega en la fase 7 del plan." />
    </>
  );
}
