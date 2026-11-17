import { Zap } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function CapturePage() {
  return (
    <>
      <PageHeader title="Captura" description="Registrá lo que resolviste sin cronómetros." step={1} />
      <EmptyState icon={<Zap />} title="En construcción" description="Esta vista llega en la fase 1 del plan." />
    </>
  );
}
