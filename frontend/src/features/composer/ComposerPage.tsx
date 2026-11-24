import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { clsx } from 'clsx';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  EyeOff,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '../../app/layout/PageHeader';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, Duration, Money } from '../../components/ui/Display';
import { SegmentedControl, type SegmentOption } from '../../components/ui/SegmentedControl';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useClients } from '../../hooks/useClients';
import { useDraftLogs } from '../../hooks/useDraftLogs';
import { useMilestones, useUpdateMilestone } from '../../hooks/useMilestones';
import { useCompose, useCreateReport } from '../../hooks/useReports';
import { usePreferences } from '../../hooks/usePreferences';
import { clientColor } from '../../domain/client-color';
import { logsForMilestone } from '../../domain/milestone-stats';
import { formatHours, sumMinutes } from '../../domain/duration';
import { getWeekPeriod } from '../../domain/week';
import type { ExecutiveTone } from '../../types/report';
import type { Milestone } from '../../types/milestone';

const TONE_OPTIONS: ReadonlyArray<SegmentOption<ExecutiveTone>> = [
  { value: 'roi_business', label: 'ROI / Negocio' },
  { value: 'tech_exec', label: 'Técnico Ejecutivo' },
  { value: 'bullets', label: 'Conciso / Bullets' },
];

export default function ComposerPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [prefs] = usePreferences();

  // Queries & Mutations
  const clientsQuery = useClients();
  const logsQuery = useDraftLogs();
  const milestonesQuery = useMilestones();

  const updateMilestone = useUpdateMilestone();
  const createReport = useCreateReport();
  const composeMutation = useCompose();

  const clients = clientsQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];

  // State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [tone, setTone] = useState<ExecutiveTone>('roi_business');
  const [isRawLogsOpen, setIsRawLogsOpen] = useState(false);

  // Local state for milestone edits: descriptions and bullets
  const [milestoneEdits, setMilestoneEdits] = useState<
    Record<string, { description: string; impact_bullets: string[] }>
  >({});

  // Active client: default to first client if none selected
  const activeClientId = selectedClientId || (clients[0]?.id ?? '');
  const activeClient = clients.find((c) => c.id === activeClientId);

  // Reconciled milestones for active client (milestones that have grouped logs)
  const clientMilestones = milestones.filter(
    (m) => m.client_id === activeClientId && m.status !== 'completed',
  );

  // Grouped logs for this client
  const clientGroupedLogs = logs.filter(
    (l) => l.client_id === activeClientId && l.status === 'grouped',
  );

  // Milestones with logs
  const reconciledMilestones = clientMilestones.filter((m) =>
    logsForMilestone(m.id, clientGroupedLogs).length > 0,
  );

  // Populate local edit state when milestones change
  useEffect(() => {
    setMilestoneEdits((prev) => {
      const next = { ...prev };
      for (const m of clientMilestones) {
        if (!next[m.id]) {
          next[m.id] = {
            description: m.description || '',
            impact_bullets:
              m.impact_bullets && m.impact_bullets.length > 0
                ? [...m.impact_bullets]
                : ['Entrega técnica completada y validada en entorno de pruebas.'],
          };
        }
      }
      return next;
    });
  }, [clientMilestones]);

  // Total billable hours and estimated payout for the selected client
  const totalMinutes = sumMinutes(clientGroupedLogs);
  const totalHours = formatHours(totalMinutes);
  const hourlyRate = activeClient?.hourly_rate ?? 0;
  const estimatedPayout = (totalMinutes / 60) * hourlyRate;

  // Handle regenerating a milestone's narrative with AI
  const handleRegenerateMilestone = async (m: Milestone) => {
    if (!activeClient) return;
    const mLogs = logsForMilestone(m.id, clientGroupedLogs);
    if (mLogs.length === 0) {
      showToast({ message: 'El hito no tiene registros agrupados', tone: 'neutral' });
      return;
    }

    try {
      const result = await composeMutation.mutateAsync({
        client: activeClient,
        milestone: m,
        logs: mLogs,
        tone,
      });

      setMilestoneEdits((prev) => ({
        ...prev,
        [m.id]: {
          description: result.description,
          impact_bullets: result.impact_bullets,
        },
      }));

      // Persist in milestone
      await updateMilestone.mutateAsync({
        id: m.id,
        input: {
          description: result.description,
          impact_bullets: result.impact_bullets,
        },
      });

      showToast({ message: 'Narrativa actualizada con IA', tone: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar narrativa';
      showToast({ message: msg, tone: 'error' });
    }
  };

  // Bullet manipulation
  const updateBullet = (milestoneId: string, index: number, value: string) => {
    setMilestoneEdits((prev) => {
      const current = prev[milestoneId];
      if (!current) return prev;
      const updatedBullets = [...current.impact_bullets];
      updatedBullets[index] = value;
      return {
        ...prev,
        [milestoneId]: { ...current, impact_bullets: updatedBullets },
      };
    });
  };

  const addBullet = (milestoneId: string) => {
    setMilestoneEdits((prev) => {
      const current = prev[milestoneId];
      if (!current) return prev;
      return {
        ...prev,
        [milestoneId]: {
          ...current,
          impact_bullets: [...current.impact_bullets, ''],
        },
      };
    });
  };

  const removeBullet = (milestoneId: string, index: number) => {
    setMilestoneEdits((prev) => {
      const current = prev[milestoneId];
      if (!current) return prev;
      return {
        ...prev,
        [milestoneId]: {
          ...current,
          impact_bullets: current.impact_bullets.filter((_, i) => i !== index),
        },
      };
    });
  };

  // Submit: Approve & Generate Client Report
  const handleApproveReport = async () => {
    if (!activeClient) return;
    if (reconciledMilestones.length === 0) {
      showToast({
        message: 'No hay hitos con registros conciliados para este cliente',
        tone: 'error',
      });
      return;
    }

    try {
      // First save all edited bullets and descriptions to milestones
      for (const m of reconciledMilestones) {
        const edits = milestoneEdits[m.id];
        if (edits) {
          await updateMilestone.mutateAsync({
            id: m.id,
            input: {
              description: edits.description,
              impact_bullets: edits.impact_bullets.filter(Boolean),
            },
          });
        }
      }

      // Calculate period
      const period = getWeekPeriod(new Date(), prefs.week_starts_on);
      const periodStart = period.start.toISOString().slice(0, 10);
      const periodEnd = period.end.toISOString().slice(0, 10);

      // Generate report
      const createdReport = await createReport.mutateAsync({
        client_id: activeClient.id,
        period_start: periodStart,
        period_end: periodEnd,
        executive_tone: tone,
        milestone_ids: reconciledMilestones.map((m) => m.id),
      });

      showToast({
        message: 'Reporte ejecutivo aprobado y generado con éxito',
        tone: 'success',
      });

      navigate(`/dispatch/${createdReport.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el reporte';
      showToast({ message: msg, tone: 'error' });
    }
  };

  if (clientsQuery.isLoading || logsQuery.isLoading || milestonesQuery.isLoading) {
    return <SkeletonList rows={6} />;
  }

  if (clientsQuery.isError || logsQuery.isError || milestonesQuery.isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos del redactor"
        onRetry={() => {
          clientsQuery.refetch();
          logsQuery.refetch();
          milestonesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Redactor de Valor Ejecutivo"
        description="Convertí actividad técnica dispersa en narrativas de impacto listas para presentar al cliente."
        step={3}
      />

      {/* 1. Client Selector Header with Consolidated Stats */}
      <section className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4">
        <label className="text-label-ui text-fg-secondary">
          Cliente a reportar
        </label>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {clients.map((client) => {
              const isSelected = client.id === activeClientId;
              const color = clientColor(client.id);
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-control px-3.5 py-2 text-body-sm font-medium transition-colors shrink-0 border',
                    isSelected
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-hairline bg-surface text-fg-secondary hover:border-hairline-focus hover:text-fg',
                  )}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span>{client.name}</span>
                </button>
              );
            })}
          </div>

          {/* Metrics summary */}
          <div className="flex items-center gap-6 text-body-sm font-mono tabular-nums">
            <div className="flex flex-col items-end">
              <span className="text-xs text-fg-muted uppercase">Horas Conciliadas</span>
              <span className="text-mono-md text-primary font-semibold">
                {totalHours}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-fg-muted uppercase">Payout Estimado</span>
              <span className="text-mono-md text-success font-semibold">
                <Money amount={estimatedPayout} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Executive Tone Switcher */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-card border border-hairline bg-surface p-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-body-md text-fg">
            Tono de Comunicación
          </span>
          <span className="text-body-sm text-fg-secondary">
            Ajusta el nivel de detalle y enfoque de negocio para el cliente.
          </span>
        </div>

        <SegmentedControl
          label="Tono Ejecutivo"
          value={tone}
          options={TONE_OPTIONS}
          onChange={(newTone) => setTone(newTone)}
        />
      </section>

      {/* 3. Collapsible Raw Technical Logs Viewer (Private) */}
      <section className="rounded-card border border-hairline bg-surface">
        <button
          type="button"
          onClick={() => setIsRawLogsOpen(!isRawLogsOpen)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-surface-raised/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <EyeOff className="size-4 text-fg-muted" aria-hidden />
            <span className="text-body-md font-semibold text-fg">
              Evidencia Técnica Bruta ({clientGroupedLogs.length} logs vinculados)
            </span>
            <span className="rounded-full bg-surface-raised border border-hairline px-2 py-0.5 text-xs text-fg-muted font-medium">
              Oculto al cliente
            </span>
          </div>
          {isRawLogsOpen ? (
            <ChevronUp className="size-4 text-fg-muted" />
          ) : (
            <ChevronDown className="size-4 text-fg-muted" />
          )}
        </button>

        {isRawLogsOpen && (
          <div className="border-t border-hairline p-4 flex flex-col gap-2">
            <div className="rounded-control bg-field/80 border border-hairline p-3 text-body-sm text-fg-secondary">
              💡 <strong>Privacidad garantizada:</strong> Estos registros son tu evidencia interna de trabajo diario. El cliente final solo recibirá la síntesis de alto valor redactada en los hitos de abajo.
            </div>

            {clientGroupedLogs.length === 0 ? (
              <p className="text-body-sm text-fg-muted py-2 text-center">
                No hay registros agrupados para este cliente.
              </p>
            ) : (
              clientGroupedLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-control border border-hairline bg-surface-raised p-2.5 text-body-sm font-mono text-xs"
                >
                  <span className="text-fg truncate">{log.description}</span>
                  <span className="text-primary shrink-0 tabular-nums font-semibold">
                    <Duration minutes={log.duration_minutes} />
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 4. Editable Impact Bullets List per Reconciled Milestone */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-fg flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>Hitos a Entregar ({reconciledMilestones.length})</span>
          </h2>
        </div>

        {reconciledMilestones.length === 0 ? (
          <EmptyState
            title="Sin hitos conciliados"
            description="No tenés hitos con registros agrupados para este cliente. Volvé a Triaje para asignar borradores a un hito."
            action={
              <Button variant="primary" onClick={() => navigate('/triage')}>
                Ir a Triaje
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {reconciledMilestones.map((milestone) => {
              const edits = milestoneEdits[milestone.id] ?? {
                description: '',
                impact_bullets: [],
              };
              const mLogs = logsForMilestone(milestone.id, clientGroupedLogs);
              const mHours = formatHours(sumMinutes(mLogs));

              return (
                <Card key={milestone.id} className="p-5 flex flex-col gap-4">
                  {/* Milestone Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-headline-sm font-semibold text-fg">
                          {milestone.title}
                        </span>
                        {milestone.category && (
                          <span className="rounded-control bg-surface-raised px-2 py-0.5 text-xs text-fg-muted border border-hairline font-mono">
                            {milestone.category}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-mono-sm text-primary">
                        {mHours} invertidas · {mLogs.length} micro-tareas conciliadas
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      loading={composeMutation.isPending}
                      icon={<RotateCw className="size-3.5" />}
                      onClick={() => handleRegenerateMilestone(milestone)}
                    >
                      Reescribir con IA
                    </Button>
                  </div>

                  {/* Narrative Description Textarea */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-label-ui text-fg-secondary">
                      Síntesis Ejecutiva
                    </label>
                    <textarea
                      rows={2}
                      value={edits.description}
                      onChange={(e) =>
                        setMilestoneEdits((prev) => ({
                          ...prev,
                          [milestone.id]: {
                            ...edits,
                            description: e.target.value,
                          },
                        }))
                      }
                      placeholder="Resumen del valor entregado para el negocio..."
                      className="w-full rounded-control border border-hairline-strong bg-field p-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Impact Bullets List */}
                  <div className="flex flex-col gap-2">
                    <label className="text-label-ui text-fg-secondary">
                      Puntos de Impacto Directo (Impact Bullets)
                    </label>

                    <div className="flex flex-col gap-2">
                      {edits.impact_bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-2.5 size-1.5 rounded-full bg-primary shrink-0" />
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) =>
                              updateBullet(milestone.id, idx, e.target.value)
                            }
                            placeholder="Impacto directo o logro medible..."
                            className="flex-1 rounded-control border border-hairline-strong bg-field px-3 py-2 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
                          />
                          <IconButton
                            label="Eliminar punto"
                            variant="ghost"
                            onClick={() => removeBullet(milestone.id, idx)}
                            className="text-fg-muted hover:text-danger mt-0.5"
                          >
                            <Trash2 className="size-4" />
                          </IconButton>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addBullet(milestone.id)}
                      icon={<Plus className="size-3.5" />}
                      className="self-start text-primary hover:bg-primary/10 mt-1"
                    >
                      Agregar punto de impacto
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Sticky Bottom Bar: Approve & Generate Client Report */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline-focus bg-surface-raised/95 px-4 py-3 backdrop-blur-md shadow-raised lg:left-[232px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-semibold text-body-sm text-fg">
              {reconciledMilestones.length} hito{reconciledMilestones.length === 1 ? '' : 's'} listo{reconciledMilestones.length === 1 ? '' : 's'} para reporte
            </span>
            <span className="font-mono text-mono-xs text-primary">
              Total: {totalHours} · <Money amount={estimatedPayout} />
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={createReport.isPending}
            disabled={reconciledMilestones.length === 0}
            onClick={handleApproveReport}
            icon={<ArrowRight className="size-4" />}
            className="font-semibold shadow-md"
          >
            Aprobar y Generar Reporte Cliente
          </Button>
        </div>
      </div>
    </div>
  );
}
