import { useState, useId } from 'react';
import { Link } from 'react-router';
import { clsx } from 'clsx';
import { isSameDay, parseISO } from 'date-fns';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  Inbox,
  Minus,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';

import { PageHeader } from '../../app/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Duration, Money } from '../../components/ui/Display';
import { SkeletonList, ErrorState } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import { useClients } from '../../hooks/useClients';
import { useCreateDraftLog, useDraftLogs } from '../../hooks/useDraftLogs';
import {
  DURATION_PRESETS,
  DURATION_STEP_MINUTES,
  clampDuration,
  formatDuration,
  formatHours,
  sumMinutes,
} from '../../domain/duration';
import { clientColor, clientInitials } from '../../domain/client-color';

const POPULAR_TAGS = [
  '#Backend',
  '#Frontend',
  '#Database',
  '#Performance',
  '#Auth',
  '#Seguridad',
  '#Pagos',
  '#DevOps',
  '#Infra',
  '#QA',
  '#Fix Crítico',
];

export default function CapturePage() {
  const showToast = useToast();
  const descriptionId = useId();

  // Queries & Mutations
  const clientsQuery = useClients();
  const logsQuery = useDraftLogs();
  const createLog = useCreateDraftLog();

  const clients = clientsQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [description, setDescription] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isTagsOpen, setIsTagsOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Active client: default to first client if none selected
  const activeClientId = selectedClientId || (clients[0]?.id ?? '');

  // Derived metrics
  const pendingLogs = logs.filter((l) => l.status === 'pending');
  const todayLogs = logs.filter((l) => {
    try {
      return isSameDay(parseISO(l.logged_at), new Date());
    } catch {
      return false;
    }
  });
  const todayMinutes = sumMinutes(todayLogs);

  // Stepper adjustments
  const adjustDuration = (delta: number) => {
    setDurationMinutes((prev) => clampDuration(prev + delta));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = customTagInput.trim();
      if (!raw) return;
      const formatted = raw.startsWith('#') ? raw : `#${raw}`;
      if (!selectedTags.includes(formatted)) {
        setSelectedTags((prev) => [...prev, formatted]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast({ message: 'Escribí qué resolviste hoy', tone: 'error' });
      return;
    }
    if (!activeClientId) {
      showToast({ message: 'Seleccioná un cliente', tone: 'error' });
      return;
    }

    try {
      await createLog.mutateAsync({
        client_id: activeClientId,
        description: description.trim(),
        duration_minutes: durationMinutes,
        tags: selectedTags,
        status: 'pending',
      });

      showToast({
        message: 'Borrador guardado en la semana',
        tone: 'success',
      });

      // Clear input but retain client and duration
      setDescription('');
      setSelectedTags([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el borrador';
      showToast({ message: msg, tone: 'error' });
    }
  };

  if (clientsQuery.isLoading) {
    return <SkeletonList rows={5} />;
  }

  if (clientsQuery.isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los clientes"
        onRetry={() => clientsQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Captura Rápida"
        description="Registrá micro-tareas y actividad técnica sin cronómetros ni fricción."
        step={1}
      />

      {/* Alert Banner: Pending Triage Notice */}
      {pendingLogs.length > 0 && (
        <div
          role="status"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-card border border-primary/30 bg-primary/10 p-3.5 text-body-md"
        >
          <div className="flex items-center gap-2 text-primary">
            <Inbox className="size-4 shrink-0" aria-hidden />
            <span>
              Tenés{' '}
              <strong className="font-semibold text-fg">
                {pendingLogs.length} borrador{pendingLogs.length === 1 ? '' : 'es'}
              </strong>{' '}
              pendiente{pendingLogs.length === 1 ? '' : 's'} de conciliar
            </span>
          </div>
          <Link
            to="/triage"
            className="inline-flex items-center gap-1.5 rounded-control bg-primary px-3 py-1.5 text-body-sm font-semibold text-fg-on-primary hover:bg-primary-pressed transition-colors shrink-0"
          >
            <span>Ir a Triaje</span>
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      )}

      {/* Main Capture Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 1. Client Horizontal Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-label-ui text-fg-secondary">
            Cliente asignado <span className="text-primary">*</span>
          </label>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {clients.map((client) => {
              const isSelected = client.id === activeClientId;
              const color = clientColor(client.id);

              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  className={clsx(
                    'group relative flex min-w-[200px] shrink-0 flex-col gap-2 rounded-card border p-3.5 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-surface-raised shadow-raised'
                      : 'border-hairline bg-surface hover:border-hairline-focus hover:bg-surface-raised/50',
                  )}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: color,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-body-md text-fg truncate">
                      {client.name}
                    </span>
                    <span
                      className="font-mono text-mono-xs font-semibold px-1.5 py-0.5 rounded-[4px] border"
                      style={{
                        color,
                        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                      }}
                    >
                      {clientInitials(client.name, client.code)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-body-sm text-fg-secondary">
                    <span className="font-mono tabular-nums text-fg-muted">
                      <Money amount={client.hourly_rate} />/h
                    </span>
                    {client.default_channel && (
                      <span className="truncate text-xs text-fg-muted max-w-[100px]">
                        {client.default_channel}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Duration Presets & Stepper */}
        <div className="flex flex-col gap-2">
          <label className="text-label-ui text-fg-secondary">
            Duración estimada <span className="text-primary">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = durationMinutes === preset.minutes;
              return (
                <Chip
                  key={preset.minutes}
                  mono
                  selected={isSelected}
                  onClick={() => setDurationMinutes(preset.minutes)}
                  icon={<Clock className="size-3.5" aria-hidden />}
                >
                  {preset.label}
                </Chip>
              );
            })}

            {/* Stepper controls */}
            <div className="flex items-center gap-1 rounded-control border border-hairline bg-surface p-0.5 ml-auto">
              <Button
                size="sm"
                variant="ghost"
                aria-label="Restar 15 minutos"
                onClick={() => adjustDuration(-DURATION_STEP_MINUTES)}
                disabled={durationMinutes <= DURATION_STEP_MINUTES}
                icon={<Minus className="size-3.5" />}
              />
              <span className="min-w-16 px-2 text-center font-mono text-mono-md text-primary font-medium tabular-nums">
                {formatDuration(durationMinutes)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Sumar 15 minutos"
                onClick={() => adjustDuration(DURATION_STEP_MINUTES)}
                icon={<Plus className="size-3.5" />}
              />
            </div>
          </div>
        </div>

        {/* 3. Description Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={descriptionId} className="text-label-ui text-fg-secondary">
            ¿Qué resolviste hoy? <span className="text-primary">*</span>
          </label>
          <textarea
            id={descriptionId}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Implementé middleware de autenticación JWT y optimicé índices en Postgres..."
            className="w-full rounded-control border border-hairline-strong bg-field p-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* 4. Collapsible Tag Selector Accordion */}
        <div className="rounded-card border border-hairline bg-surface">
          <button
            type="button"
            onClick={() => setIsTagsOpen(!isTagsOpen)}
            className="flex w-full items-center justify-between p-3.5 text-left text-body-sm font-medium text-fg-secondary hover:text-fg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-primary" aria-hidden />
              <span>Etiquetas y Contexto</span>
              {selectedTags.length > 0 && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-mono-xs text-primary font-semibold">
                  {selectedTags.length}
                </span>
              )}
            </div>
            {isTagsOpen ? (
              <ChevronUp className="size-4 text-fg-muted" />
            ) : (
              <ChevronDown className="size-4 text-fg-muted" />
            )}
          </button>

          {isTagsOpen && (
            <div className="flex flex-col gap-3 border-t border-hairline p-3.5 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Chip
                      key={tag}
                      selected={isSelected}
                      onClick={() => toggleTag(tag)}
                      className="text-xs h-8"
                    >
                      {tag}
                    </Chip>
                  );
                })}
              </div>

              {/* Custom tag input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  placeholder="Agregar etiqueta personalizada (Enter)..."
                  className="h-9 flex-1 rounded-control border border-hairline-strong bg-field px-3 text-body-sm text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Primary Submit CTA */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={createLog.isPending}
          icon={<Send className="size-4" />}
          className="h-12 text-body-lg font-semibold shadow-md"
        >
          Guardar en Borradores Semanales
        </Button>
      </form>

      {/* 6. Collapsible Bottom Summary Bar: Today's Logged Blocks */}
      <div className="rounded-card border border-hairline bg-surface">
        <button
          type="button"
          onClick={() => setIsSummaryOpen(!isSummaryOpen)}
          className="flex w-full items-center justify-between p-4 text-left text-body-md hover:bg-surface-raised/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-control bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div>
              <span className="font-semibold text-fg">Hoy: </span>
              <span className="font-mono text-primary font-medium tabular-nums">
                {formatHours(todayMinutes)}
              </span>{' '}
              <span className="text-fg-secondary">
                ({todayLogs.length} bloque{todayLogs.length === 1 ? '' : 's'} registrado{todayLogs.length === 1 ? '' : 's'})
              </span>
            </div>
          </div>
          {isSummaryOpen ? (
            <ChevronUp className="size-4 text-fg-muted" />
          ) : (
            <ChevronDown className="size-4 text-fg-muted" />
          )}
        </button>

        {isSummaryOpen && (
          <div className="border-t border-hairline p-4 pt-3 flex flex-col gap-2">
            {todayLogs.length === 0 ? (
              <p className="text-body-sm text-fg-muted py-2 text-center">
                Todavía no registraste bloques hoy. ¡Guardá el primero arriba!
              </p>
            ) : (
              todayLogs.map((log) => {
                const client = clients.find((c) => c.id === log.client_id);
                return (
                  <div
                    key={log.id}
                    className="flex items-start justify-between gap-3 rounded-control border border-hairline bg-surface-raised p-2.5 text-body-sm"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-fg truncate">
                        {log.description}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-fg-secondary">
                        {client && (
                          <span
                            className="font-medium"
                            style={{ color: clientColor(client.id) }}
                          >
                            {client.name}
                          </span>
                        )}
                        {log.tags.length > 0 && (
                          <span className="text-fg-muted">
                            {log.tags.slice(0, 3).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-mono-sm text-primary font-medium tabular-nums">
                      <Duration minutes={log.duration_minutes} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
