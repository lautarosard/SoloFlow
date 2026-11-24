import { useState } from 'react';
import { useNavigate } from 'react-router';
import { clsx } from 'clsx';
import {
  ArrowRight,
  CheckSquare,
  FolderPlus,
  FolderSync,
  Inbox,
  Square,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import { PageHeader } from '../../app/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, Duration, ProgressBar } from '../../components/ui/Display';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/States';
import { Sheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useClients } from '../../hooks/useClients';
import {
  useDraftLogs,
  useUpdateDraftLog,
  useUpdateDraftLogs,
} from '../../hooks/useDraftLogs';
import { useCreateMilestone, useMilestones } from '../../hooks/useMilestones';
import { clientColor } from '../../domain/client-color';
import { milestoneProgress } from '../../domain/milestone-stats';
import { formatHours, sumMinutes } from '../../domain/duration';
import { relativeDayLabel } from '../../domain/week';
import type { DraftLog } from '../../types/draft-log';

export default function TriagePage() {
  const navigate = useNavigate();
  const showToast = useToast();

  // Queries & Mutations
  const clientsQuery = useClients();
  const logsQuery = useDraftLogs();
  const milestonesQuery = useMilestones();

  const updateLog = useUpdateDraftLog();
  const updateLogs = useUpdateDraftLogs();
  const createMilestone = useCreateMilestone();

  const clients = clientsQuery.data ?? [];
  const logs = logsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];

  // Filter & Selection State
  const [filterClientId, setFilterClientId] = useState<string>('all');
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Assign Sheet State
  const [isAssignSheetOpen, setIsAssignSheetOpen] = useState(false);
  const [targetLogIds, setTargetLogIds] = useState<string[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [isCreatingNewMilestone, setIsCreatingNewMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneHours, setNewMilestoneHours] = useState('');
  const [newMilestoneCategory, setNewMilestoneCategory] = useState('');

  // Filtered pending logs
  const pendingLogs = logs.filter((l) => l.status === 'pending');
  const filteredLogs =
    filterClientId === 'all'
      ? pendingLogs
      : pendingLogs.filter((l) => l.client_id === filterClientId);

  // Active milestones (unarchived)
  const activeMilestones = milestones.filter(
    (m) =>
      m.status === 'active' &&
      (filterClientId === 'all' || m.client_id === filterClientId),
  );

  const pendingMinutes = sumMinutes(filteredLogs);

  // Multi-select handlers
  const isAllSelected =
    filteredLogs.length > 0 && selectedLogIds.length === filteredLogs.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(filteredLogs.map((l) => l.id));
    }
  };

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Actions: Dismiss Single Log
  const handleDismissLog = async (log: DraftLog) => {
    try {
      await updateLog.mutateAsync({
        id: log.id,
        input: { status: 'discarded' },
      });

      showToast({
        message: 'Borrador descartado',
        tone: 'neutral',
        action: {
          label: 'Deshacer',
          onClick: () => {
            updateLog.mutate({
              id: log.id,
              input: { status: 'pending' },
            });
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descartar';
      showToast({ message: msg, tone: 'error' });
    }
  };

  // Actions: Dismiss Selected Logs
  const handleDismissSelected = async () => {
    if (selectedLogIds.length === 0) return;
    const idsToDiscard = [...selectedLogIds];
    try {
      await updateLogs.mutateAsync({
        ids: idsToDiscard,
        input: { status: 'discarded' },
      });
      setSelectedLogIds([]);

      showToast({
        message: `${idsToDiscard.length} borradores descartados`,
        tone: 'neutral',
        action: {
          label: 'Deshacer',
          onClick: () => {
            updateLogs.mutate({
              ids: idsToDiscard,
              input: { status: 'pending' },
            });
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descartar seleccionados';
      showToast({ message: msg, tone: 'error' });
    }
  };

  // Open Assign Modal for single or multiple logs
  const openAssignModal = (ids: string[]) => {
    setTargetLogIds(ids);
    setSelectedMilestoneId('');
    setIsCreatingNewMilestone(false);
    setNewMilestoneTitle('');
    setNewMilestoneHours('');
    setNewMilestoneCategory('');
    setIsAssignSheetOpen(true);
  };

  // Submit Milestone Assignment
  const handleConfirmAssignment = async () => {
    if (targetLogIds.length === 0) return;

    // Detect target client
    const targetLogs = logs.filter((l) => targetLogIds.includes(l.id));
    const targetClientId = targetLogs[0]?.client_id;
    if (!targetClientId) return;

    try {
      let milestoneId = selectedMilestoneId;

      if (isCreatingNewMilestone) {
        if (!newMilestoneTitle.trim()) {
          showToast({ message: 'Escribí el título del hito', tone: 'error' });
          return;
        }

        const created = await createMilestone.mutateAsync({
          client_id: targetClientId,
          title: newMilestoneTitle.trim(),
          category: newMilestoneCategory.trim() || undefined,
          estimated_hours: newMilestoneHours ? Number(newMilestoneHours) : null,
        });
        milestoneId = created.id;
      }

      if (!milestoneId) {
        showToast({ message: 'Seleccioná o creá un hito', tone: 'error' });
        return;
      }

      await updateLogs.mutateAsync({
        ids: targetLogIds,
        input: {
          milestone_id: milestoneId,
          status: 'grouped',
        },
      });

      showToast({
        message: `${targetLogIds.length} borrador${targetLogIds.length === 1 ? '' : 'es'} asignado${targetLogIds.length === 1 ? '' : 's'} al hito`,
        tone: 'success',
      });

      setIsAssignSheetOpen(false);
      setSelectedLogIds((prev) => prev.filter((id) => !targetLogIds.includes(id)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al asignar hito';
      showToast({ message: msg, tone: 'error' });
    }
  };

  if (clientsQuery.isLoading || logsQuery.isLoading || milestonesQuery.isLoading) {
    return <SkeletonList rows={6} />;
  }

  if (clientsQuery.isError || logsQuery.isError || milestonesQuery.isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de triaje"
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
        title="Bandeja de Triaje"
        description="Conciliá los borradores de la semana asignándolos a hitos de valor para el cliente."
        step={2}
      />

      {/* Client Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setFilterClientId('all');
            setSelectedLogIds([]);
          }}
          className={clsx(
            'inline-flex items-center gap-2 rounded-control px-3.5 py-2 text-body-sm font-medium transition-colors shrink-0 border',
            filterClientId === 'all'
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-hairline bg-surface text-fg-secondary hover:border-hairline-focus hover:text-fg',
          )}
        >
          <span>Todos los clientes</span>
          <span className="rounded-full bg-surface-raised px-2 py-0.5 font-mono text-mono-xs text-fg-muted font-semibold">
            {pendingLogs.length}
          </span>
        </button>

        {clients.map((client) => {
          const clientPendingCount = pendingLogs.filter(
            (l) => l.client_id === client.id,
          ).length;
          const isSelected = filterClientId === client.id;
          const color = clientColor(client.id);

          return (
            <button
              key={client.id}
              type="button"
              onClick={() => {
                setFilterClientId(client.id);
                setSelectedLogIds([]);
              }}
              className={clsx(
                'inline-flex items-center gap-2 rounded-control px-3 py-2 text-body-sm font-medium transition-colors shrink-0 border',
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
              <span className="truncate max-w-[140px]">{client.name}</span>
              <span className="rounded-full bg-surface-raised px-1.5 py-0.2 font-mono text-mono-xs text-fg-muted font-semibold">
                {clientPendingCount}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left Column: Pending Draft Logs List */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-label-ui text-fg-secondary">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-1.5 text-fg hover:text-primary transition-colors disabled:opacity-40"
              >
                {isAllSelected ? (
                  <CheckSquare className="size-4 text-primary" />
                ) : (
                  <Square className="size-4 text-fg-muted" />
                )}
                <span>Seleccionar todos</span>
              </button>
            </div>
            <span className="font-mono text-mono-sm text-fg-secondary tabular-nums">
              {filteredLogs.length} pendiente{filteredLogs.length === 1 ? '' : 's'} ·{' '}
              <span className="text-primary">{formatHours(pendingMinutes)}</span>
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title="Bandeja limpia"
              description="No hay borradores pendientes de conciliar en este filtro. ¡Excelente trabajo!"
              action={
                <Button variant="primary" onClick={() => navigate('/composer')}>
                  Avanzar a Redactor
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLogs.map((log) => {
                const client = clients.find((c) => c.id === log.client_id);
                const isSelected = selectedLogIds.includes(log.id);
                const color = client ? clientColor(client.id) : undefined;

                return (
                  <Card
                    key={log.id}
                    className={clsx(
                      'flex flex-col gap-3 p-4 transition-all',
                      isSelected
                        ? 'border-primary bg-surface-raised/80'
                        : 'hover:border-hairline-focus hover:bg-surface-raised/40',
                    )}
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: color,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectLog(log.id)}
                          className="mt-0.5 text-fg-muted hover:text-primary transition-colors"
                          aria-label={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-primary" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="text-body-md font-medium text-fg leading-relaxed">
                            {log.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-secondary">
                            {client && (
                              <span
                                className="font-semibold"
                                style={{ color }}
                              >
                                {client.name}
                              </span>
                            )}
                            <span className="text-fg-muted">·</span>
                            <span className="text-fg-muted">
                              {relativeDayLabel(log.logged_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="shrink-0 font-mono text-mono-md text-primary font-semibold tabular-nums">
                        <Duration minutes={log.duration_minutes} />
                      </span>
                    </div>

                    {/* Tags and standardized actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
                      <div className="flex flex-wrap gap-1">
                        {log.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-[4px] bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] text-fg-muted border border-hairline"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismissLog(log)}
                          icon={<Trash2 className="size-3.5 text-danger" />}
                          className="text-danger hover:bg-danger/10"
                        >
                          Descartar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAssignModal([log.id])}
                          icon={<FolderPlus className="size-3.5 text-primary" />}
                        >
                          Asignar a Hito
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Active Milestones Destination Section */}
        <aside className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <h2 className="text-headline-sm text-fg flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span>Hitos Activos</span>
            </h2>
            <span className="text-label-ui text-fg-muted">
              {activeMilestones.length}
            </span>
          </div>

          {activeMilestones.length === 0 ? (
            <p className="text-body-sm text-fg-muted py-4 text-center">
              No hay hitos activos para este filtro.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeMilestones.map((milestone) => {
                const client = clients.find((c) => c.id === milestone.client_id);
                const progress = milestoneProgress(milestone, logs);

                return (
                  <div
                    key={milestone.id}
                    className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-raised p-3 text-body-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-fg truncate">
                        {milestone.title}
                      </span>
                      {progress.overBudget && (
                        <span className="shrink-0 rounded-full bg-danger/15 px-1.5 py-0.5 font-mono text-[10px] text-danger font-semibold">
                          Excedido
                        </span>
                      )}
                    </div>

                    {client && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: clientColor(client.id) }}
                      >
                        {client.name}
                      </span>
                    )}

                    <div className="flex flex-col gap-1 pt-1">
                      <ProgressBar
                        value={progress.ratio ?? (progress.consolidatedHours > 0 ? 1 : 0)}
                        tone={progress.overBudget ? 'danger' : 'primary'}
                        label={`Progreso de ${milestone.title}`}
                      />
                      <div className="flex items-center justify-between text-xs text-fg-secondary font-mono">
                        <span className="text-fg font-medium">
                          {progress.consolidatedHours}h conciliadas
                        </span>
                        <span>
                          {milestone.estimated_hours
                            ? `Meta: ${milestone.estimated_hours}h`
                            : 'Sin meta'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>

      {/* Sticky Bottom Dock: Contextual switches between Batch Mode & Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline-focus bg-surface-raised/95 px-4 py-3 backdrop-blur-md shadow-raised lg:left-[232px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          {selectedLogIds.length > 0 ? (
            /* STATE 1: Batch Actions */
            <>
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary font-mono text-mono-xs font-bold text-fg-on-primary">
                  {selectedLogIds.length}
                </span>
                <span className="text-body-sm font-medium text-fg">
                  seleccionados para lote
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDismissSelected}
                  icon={<Trash2 className="size-3.5" />}
                >
                  Descartar ({selectedLogIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => openAssignModal(selectedLogIds)}
                  icon={<FolderSync className="size-3.5" />}
                >
                  Asignar a Hito
                </Button>
              </div>
            </>
          ) : (
            /* STATE 2: General Triage Summary & Navigation */
            <>
              <div className="flex flex-col">
                <span className="font-semibold text-body-sm text-fg">
                  {pendingLogs.length} borrador{pendingLogs.length === 1 ? '' : 'es'} pendiente{pendingLogs.length === 1 ? '' : 's'}
                </span>
                <span className="font-mono text-mono-xs text-fg-muted">
                  {formatHours(sumMinutes(pendingLogs))} acumuladas sin conciliar
                </span>
              </div>

              <Button
                variant="primary"
                onClick={() => navigate('/composer')}
                icon={<ArrowRight className="size-4" />}
                className="font-semibold"
              >
                Avanzar a Redactor
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sheet Modal: Assign to Milestone or Create New */}
      <Sheet
        open={isAssignSheetOpen}
        onClose={() => setIsAssignSheetOpen(false)}
        title="Asignar Borradores a Hito"
        description={`Asignando ${targetLogIds.length} borrador${targetLogIds.length === 1 ? '' : 'es'} a un entregable de valor.`}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsAssignSheetOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAssignment}
              loading={updateLogs.isPending || createMilestone.isPending}
            >
              Confirmar Asignación
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Toggle between existing or new milestone */}
          <div className="flex gap-2 p-1 rounded-control bg-surface border border-hairline">
            <button
              type="button"
              onClick={() => setIsCreatingNewMilestone(false)}
              className={clsx(
                'flex-1 py-1.5 rounded-[4px] text-body-sm font-medium transition-colors',
                !isCreatingNewMilestone
                  ? 'bg-surface-raised text-fg shadow-raised'
                  : 'text-fg-secondary hover:text-fg',
              )}
            >
              Hito Existente
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNewMilestone(true)}
              className={clsx(
                'flex-1 py-1.5 rounded-[4px] text-body-sm font-medium transition-colors',
                isCreatingNewMilestone
                  ? 'bg-surface-raised text-fg shadow-raised'
                  : 'text-fg-secondary hover:text-fg',
              )}
            >
              + Nuevo Hito
            </button>
          </div>

          {!isCreatingNewMilestone ? (
            <div className="flex flex-col gap-2">
              <label className="text-label-ui text-fg-secondary">
                Seleccioná el hito de destino
              </label>
              {milestones.length === 0 ? (
                <p className="text-body-sm text-fg-muted py-2">
                  No hay hitos existentes. Creá uno nuevo arriba.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {milestones.map((m) => {
                    const client = clients.find((c) => c.id === m.client_id);
                    const isSelected = selectedMilestoneId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMilestoneId(m.id)}
                        className={clsx(
                          'flex flex-col gap-1 rounded-control border p-3 text-left transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/10 text-fg'
                            : 'border-hairline bg-surface hover:border-hairline-focus',
                        )}
                      >
                        <span className="font-semibold text-body-md">
                          {m.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-fg-secondary">
                          {client && <span>{client.name}</span>}
                          <span>·</span>
                          <span className="font-mono">
                            {m.consolidated_hours}h invertidas
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-ui text-fg-secondary">
                  Título del Hito <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="Ej: Migración de Gateway de Pagos Stripe"
                  className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-ui text-fg-secondary">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newMilestoneCategory}
                    onChange={(e) => setNewMilestoneCategory(e.target.value)}
                    placeholder="Ej: Backend, Seguridad"
                    className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-ui text-fg-secondary">
                    Horas estimadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMilestoneHours}
                    onChange={(e) => setNewMilestoneHours(e.target.value)}
                    placeholder="Ej: 20"
                    className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
