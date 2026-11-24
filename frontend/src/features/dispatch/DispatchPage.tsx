import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  DollarSign,
  Globe,
  Milestone as MilestoneIcon,
  Send,
  User as UserIcon,
} from 'lucide-react';

import { PageHeader } from '../../app/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, Duration, Money, StatusPill } from '../../components/ui/Display';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useClients } from '../../hooks/useClients';
import { useMilestones } from '../../hooks/useMilestones';
import {
  useEnablePublicLink,
  useReports,
  useUpdateReport,
} from '../../hooks/useReports';
import { useMe } from '../../hooks/useUser';
import { clientColor } from '../../domain/client-color';
import type { Report } from '../../types/report';
import type { Milestone } from '../../types/milestone';

export default function DispatchPage() {
  const { reportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const showToast = useToast();

  // Queries
  const reportsQuery = useReports();
  const clientsQuery = useClients();
  const milestonesQuery = useMilestones();
  const userQuery = useMe();

  const enablePublicLinkMutation = useEnablePublicLink();
  const updateReportMutation = useUpdateReport();

  const reports = reportsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const user = userQuery.data;

  // Selected report: by param, or latest report
  const activeReport: Report | undefined = reportId
    ? reports.find((r) => r.id === reportId)
    : reports[0];

  const client = activeReport
    ? clients.find((c) => c.id === activeReport.client_id)
    : undefined;

  // Milestones included in this report
  const reportMilestones: Milestone[] = activeReport
    ? milestones.filter((m) => m.report_id === activeReport.id)
    : [];

  // Local UI states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // Helper to generate formatted Markdown text for Slack / WhatsApp
  const generateFormattedMarkdown = () => {
    if (!activeReport || !client) return '';

    const lines: string[] = [
      `🚀 *Reporte Ejecutivo: ${client.name}*`,
      `📄 *Código:* \`${activeReport.report_code}\` | 📅 *Período:* ${activeReport.period_start} al ${activeReport.period_end}`,
      `👤 *Especialista:* ${user?.name || 'Consultor'} (${user?.role_title || 'Contractor'})`,
      `⏱ *Horas facturables:* ${activeReport.total_billable_hours}h | 💵 *Total:* $${activeReport.total_amount.toFixed(2)} ($${activeReport.hourly_rate_snapshot}/h)`,
      '',
      `🎯 *Entregables e Impacto de Valor:*`,
    ];

    for (const m of reportMilestones) {
      lines.push(`• *${m.title}* (${m.consolidated_hours}h)`);
      if (m.description) {
        lines.push(`  _${m.description}_`);
      }
      for (const bullet of m.impact_bullets) {
        lines.push(`  ✅ ${bullet}`);
      }
      lines.push('');
    }

    if (activeReport.is_public_enabled && activeReport.public_token) {
      lines.push(`🔗 *Ver reporte online:* ${window.location.origin}/public/${activeReport.public_token}`);
    }

    return lines.join('\n');
  };

  const markdownContent = generateFormattedMarkdown();

  // Handle Copy to Clipboard
  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      showToast({
        message: '¡Copiado al portapapeles con éxito! Listo para pegar en Slack o WhatsApp.',
        tone: 'success',
      });
    } catch {
      showToast({ message: 'No se pudo copiar al portapapeles', tone: 'error' });
    }
  };

  // Handle Copy Public Link
  const handleCopyPublicLink = async () => {
    if (!activeReport?.public_token) return;
    const url = `${window.location.origin}/public/${activeReport.public_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2500);
      showToast({
        message: 'Enlace público copiado al portapapeles',
        tone: 'success',
      });
    } catch {
      showToast({ message: 'No se pudo copiar el enlace', tone: 'error' });
    }
  };

  // Handle Toggle Public Link (with 7 days validity)
  const handleTogglePublicLink = async () => {
    if (!activeReport) return;
    try {
      if (!activeReport.is_public_enabled) {
        await enablePublicLinkMutation.mutateAsync({
          id: activeReport.id,
          days: 7,
        });
        showToast({
          message: 'Enlace público activado por 7 días con auto-expiración',
          tone: 'success',
        });
      } else {
        await updateReportMutation.mutateAsync({
          id: activeReport.id,
          input: { is_public_enabled: false },
        });
        showToast({
          message: 'Enlace público desactivado',
          tone: 'neutral',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al modificar enlace';
      showToast({ message: msg, tone: 'error' });
    }
  };

  if (reportsQuery.isLoading || clientsQuery.isLoading || milestonesQuery.isLoading) {
    return <SkeletonList rows={6} />;
  }

  if (reportsQuery.isError || clientsQuery.isError || milestonesQuery.isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de despacho"
        onRetry={() => {
          reportsQuery.refetch();
          clientsQuery.refetch();
          milestonesQuery.refetch();
        }}
      />
    );
  }

  if (!activeReport) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Despacho de Reportes"
          description="Exportá y compartí reportes ejecutivos listos para enviar al cliente."
          step={4}
        />
        <EmptyState
          title="No hay reportes generados"
          description="Todavía no aprobaste ningún reporte ejecutivo. Pasá por el Redactor para consolidar hitos."
          action={
            <Button variant="primary" onClick={() => navigate('/composer')}>
              Ir al Redactor
            </Button>
          }
        />
      </div>
    );
  }

  const color = client ? clientColor(client.id) : undefined;
  const statusTone =
    activeReport.status === 'dispatched'
      ? 'info'
      : activeReport.status === 'approved'
      ? 'success'
      : 'neutral';

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Despacho Oficial"
        description="Revisá el entregable final aprobado, copiá la síntesis para canales ejecutivos y compartí el enlace protegido."
        step={4}
      />

      {/* 1. Executive Header */}
      <Card
        className="p-5 flex flex-col gap-4 shadow-sm"
        style={{ borderTopWidth: '4px', borderTopColor: color }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-mono-md font-bold text-primary">
                {activeReport.report_code}
              </span>
              <StatusPill tone={statusTone}>
                {activeReport.status === 'dispatched'
                  ? 'Despachado'
                  : activeReport.status === 'approved'
                  ? 'Aprobado'
                  : 'Borrador'}
              </StatusPill>
            </div>
            <h1 className="text-headline-md font-semibold text-fg">
              {client?.name ?? 'Cliente'}
            </h1>
          </div>

          {/* Report switcher if multiple reports exist */}
          {reports.length > 1 && (
            <select
              value={activeReport.id}
              onChange={(e) => navigate(`/dispatch/${e.target.value}`)}
              className="h-9 rounded-control border border-hairline bg-field px-3 text-body-sm text-fg"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.report_code} · {r.period_start}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Metadata info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-hairline pt-3 text-body-sm">
          <div className="flex items-center gap-2 text-fg-secondary">
            <Calendar className="size-4 text-fg-muted shrink-0" />
            <span>
              Período: <strong className="text-fg">{activeReport.period_start}</strong> al{' '}
              <strong className="text-fg">{activeReport.period_end}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-fg-secondary">
            <UserIcon className="size-4 text-fg-muted shrink-0" />
            <span>
              Especialista: <strong className="text-fg">{user?.name || 'Contractor'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-fg-secondary">
            <DollarSign className="size-4 text-fg-muted shrink-0" />
            <span>
              Tarifa congelada:{' '}
              <strong className="font-mono text-fg">
                <Money amount={activeReport.hourly_rate_snapshot} />/h
              </strong>
            </span>
          </div>
        </div>
      </Card>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1 p-4">
          <span className="flex items-center gap-1.5 text-label-ui text-fg-secondary">
            <Clock className="size-4 text-primary" />
            Horas Facturables
          </span>
          <span className="font-mono text-headline-sm text-primary font-semibold tabular-nums">
            {activeReport.total_billable_hours}h
          </span>
          <span className="text-xs text-fg-muted">
            <Duration minutes={activeReport.total_billable_hours * 60} /> totales
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-4">
          <span className="flex items-center gap-1.5 text-label-ui text-fg-secondary">
            <MilestoneIcon className="size-4 text-info" />
            Hitos Entregados
          </span>
          <span className="font-mono text-headline-sm text-info font-semibold tabular-nums">
            {reportMilestones.length}
          </span>
          <span className="text-xs text-fg-muted">
            Entregables verificados
          </span>
        </Card>

        <Card className="flex flex-col gap-1 p-4">
          <span className="flex items-center gap-1.5 text-label-ui text-fg-secondary">
            <DollarSign className="size-4 text-success" />
            Honorarios Totales
          </span>
          <span className="font-mono text-headline-sm text-success font-semibold tabular-nums">
            <Money amount={activeReport.total_amount} />
          </span>
          <span className="text-xs text-fg-muted">
            Payout a liquidar
          </span>
        </Card>
      </div>

      {/* 3. Verified Milestone Deliverable Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-headline-sm text-fg flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" />
          <span>Entregables e Impacto Verificado ({reportMilestones.length})</span>
        </h2>

        {reportMilestones.length === 0 ? (
          <p className="text-body-sm text-fg-muted py-2">
            No se encontraron hitos vinculados a este reporte.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reportMilestones.map((m) => (
              <Card key={m.id} className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-body-md text-fg">
                      {m.title}
                    </span>
                    {m.category && (
                      <span className="rounded-control bg-surface-raised px-2 py-0.5 text-xs text-fg-muted font-mono border border-hairline">
                        {m.category}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-mono-sm text-primary font-semibold tabular-nums">
                    {m.consolidated_hours}h
                  </span>
                </div>

                {m.description && (
                  <p className="text-body-sm text-fg-secondary italic">
                    {m.description}
                  </p>
                )}

                <div className="flex flex-col gap-1.5 pt-1">
                  {m.impact_bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-body-sm text-fg">
                      <Check className="size-4 text-success shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. Quick Dispatch Box */}
      <section className="rounded-card border border-hairline bg-surface p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-hairline">
          <h2 className="text-headline-sm text-fg flex items-center gap-2">
            <Send className="size-4 text-primary" />
            <span>Despacho Rápido</span>
          </h2>
        </div>

        {/* Action: Copy Formatted Markdown button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-control bg-surface-raised p-4 border border-hairline">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-body-md text-fg">
              Síntesis para Canales Ejecutivos
            </span>
            <span className="text-body-sm text-fg-secondary">
              Formateado con markdown limpio para pegar directamente en Slack o WhatsApp.
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            onClick={handleCopyMarkdown}
            className="shrink-0 font-semibold"
          >
            {isCopied ? '¡Copiado!' : 'Copiar Formato Markdown'}
          </Button>
        </div>

        {/* Collapsible raw Markdown preview */}
        <div className="rounded-control border border-hairline bg-field">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex w-full items-center justify-between p-3 text-left text-body-sm text-fg-secondary hover:text-fg transition-colors"
          >
            <span className="font-mono text-xs uppercase">
              {isPreviewOpen ? 'Ocultar' : 'Ver'} Vista Previa de Markdown
            </span>
            {isPreviewOpen ? (
              <ChevronUp className="size-4 text-fg-muted" />
            ) : (
              <ChevronDown className="size-4 text-fg-muted" />
            )}
          </button>

          {isPreviewOpen && (
            <div className="border-t border-hairline p-3">
              <pre className="font-mono text-xs text-fg-secondary whitespace-pre-wrap overflow-x-auto bg-canvas p-3 rounded-control border border-hairline max-h-64">
                {markdownContent}
              </pre>
            </div>
          )}
        </div>

        {/* Public Link toggle and auto-expiration */}
        <div className="flex flex-col gap-3 rounded-control bg-surface-raised p-4 border border-hairline">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Globe className="size-4 text-info" />
              <div className="flex flex-col">
                <span className="font-semibold text-body-md text-fg">
                  Enlace Público con Auto-Expiración (7 días)
                </span>
                <span className="text-body-sm text-fg-secondary">
                  Permite al cliente revisar el reporte en una página web segura sin requerir login.
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant={activeReport.is_public_enabled ? 'destructive' : 'secondary'}
              loading={enablePublicLinkMutation.isPending || updateReportMutation.isPending}
              onClick={handleTogglePublicLink}
            >
              {activeReport.is_public_enabled ? 'Desactivar Enlace' : 'Activar Enlace'}
            </Button>
          </div>

          {activeReport.is_public_enabled && activeReport.public_token && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-hairline/60">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/public/${activeReport.public_token}`}
                className="flex-1 h-9 rounded-control border border-hairline bg-field px-3 font-mono text-xs text-fg-secondary select-all"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={isLinkCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                onClick={handleCopyPublicLink}
              >
                {isLinkCopied ? '¡Copiado!' : 'Copiar URL'}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
