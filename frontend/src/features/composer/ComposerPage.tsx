import { Sparkles } from 'lucide-react';
import { PageHeader } from '../../app/layout/PageHeader';
import { EmptyState } from '../../components/ui/States';

export default function ComposerPage() {
  return (
    <>
      <PageHeader title="Redactor" description="Convertí el trabajo técnico en una narrativa para el cliente." step={3} />
      <EmptyState icon={<Sparkles />} title="En construcción" description="Esta vista llega en la fase 3 del plan." />
    </>
  );
}
