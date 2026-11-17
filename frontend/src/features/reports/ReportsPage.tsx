import { FileCheck2 } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reportes" description="Historial de reportes emitidos." />
      <EmptyState icon={<FileCheck2 />} title="En construcción" description="Esta vista llega en la fase 5 del plan." />
    </>
  );
}
