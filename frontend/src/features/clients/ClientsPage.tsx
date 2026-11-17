import { Users } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Clientes" description="Tus cuentas activas y tarifas." />
      <EmptyState icon={<Users />} title="En construcción" description="Esta vista llega en la fase 6 del plan." />
    </>
  );
}
