import { Inbox } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function TriagePage() {
  return (
    <>
      <PageHeader title="Triaje" description="Agrupá los borradores de la semana en hitos." step={2} />
      <EmptyState icon={<Inbox />} title="En construcción" description="Esta vista llega en la fase 2 del plan." />
    </>
  );
}
