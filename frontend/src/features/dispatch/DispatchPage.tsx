import { Send } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function DispatchPage() {
  return (
    <>
      <PageHeader title="Despacho" description="Revisá y enviá el reporte al cliente." step={4} />
      <EmptyState icon={<Send />} title="En construcción" description="Esta vista llega en la fase 4 del plan." />
    </>
  );
}
