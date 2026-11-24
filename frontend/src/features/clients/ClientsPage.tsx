import { useState } from 'react';
import {
  Calendar,
  DollarSign,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

import { PageHeader } from '../../app/layout/PageHeader';
import { Button, IconButton } from '../../components/ui/Button';
import { Card, Money } from '../../components/ui/Display';
import { ConfirmDialog, Sheet } from '../../components/ui/Sheet';
import { EmptyState, ErrorState, SkeletonList } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '../../hooks/useClients';
import { useMilestones } from '../../hooks/useMilestones';
import { useDraftLogs } from '../../hooks/useDraftLogs';
import { clientColor, clientInitials } from '../../domain/client-color';
import type { Client } from '../../types/client';

const BILLING_CYCLE_OPTIONS = [
  'Facturación quincenal',
  'Facturación mensual',
  'Facturación semanal',
  'Por hito entregado',
];

export default function ClientsPage() {
  const showToast = useToast();

  // Queries & Mutations
  const clientsQuery = useClients();
  const milestonesQuery = useMilestones();
  const logsQuery = useDraftLogs();

  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  const clients = clientsQuery.data ?? [];
  const milestones = milestonesQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  // Sheet Modal State (Create / Edit)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formHourlyRate, setFormHourlyRate] = useState('');
  const [formChannel, setFormChannel] = useState('');
  const [formBillingCycle, setFormBillingCycle] = useState('Facturación quincenal');

  // Delete Confirm Dialog State
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Open modal for creating new client
  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormName('');
    setFormCode('');
    setFormHourlyRate('85');
    setFormChannel('');
    setFormBillingCycle('Facturación quincenal');
    setIsSheetOpen(true);
  };

  // Open modal for editing existing client
  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCode(client.code || '');
    setFormHourlyRate(String(client.hourly_rate));
    setFormChannel(client.default_channel || '');
    setFormBillingCycle(client.billing_cycle || 'Facturación quincenal');
    setIsSheetOpen(true);
  };

  // Form submit handler (Create or PATCH update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast({ message: 'El nombre del cliente es obligatorio', tone: 'error' });
      return;
    }

    const rate = Number(formHourlyRate);
    if (isNaN(rate) || rate < 0) {
      showToast({ message: 'La tarifa horaria debe ser un número mayor o igual a 0', tone: 'error' });
      return;
    }

    try {
      if (editingClient) {
        // PATCH update
        await updateClientMutation.mutateAsync({
          id: editingClient.id,
          input: {
            name: formName.trim(),
            code: formCode.trim() ? formCode.trim().toUpperCase() : null,
            hourly_rate: rate,
            default_channel: formChannel.trim() || null,
            billing_cycle: formBillingCycle || null,
          },
        });
        showToast({ message: 'Cliente actualizado exitosamente', tone: 'success' });
      } else {
        // Create
        await createClientMutation.mutateAsync({
          name: formName.trim(),
          code: formCode.trim() ? formCode.trim().toUpperCase() : null,
          hourly_rate: rate,
          default_channel: formChannel.trim() || null,
          billing_cycle: formBillingCycle || null,
        });
        showToast({ message: 'Cliente creado exitosamente', tone: 'success' });
      }

      setIsSheetOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar cliente';
      showToast({ message: msg, tone: 'error' });
    }
  };

  // Delete client handler
  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteClientMutation.mutateAsync(deletingClient.id);
      showToast({ message: 'Cliente eliminado correctamente', tone: 'neutral' });
      setDeletingClient(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar cliente';
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
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Gestión de Clientes"
        description="Administrá tus cuentas activas, tarifas horarias pactadas y canales de comunicación."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="size-4" />}
            onClick={handleOpenCreate}
            className="font-semibold shadow-sm"
          >
            Nuevo Cliente
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Sin clientes registrados"
          description="Agregá tu primer cliente para comenzar a registrar horas y generar reportes."
          action={
            <Button variant="primary" onClick={handleOpenCreate}>
              Agregar Primer Cliente
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((client) => {
            const color = clientColor(client.id);
            const clientMilestonesCount = milestones.filter(
              (m) => m.client_id === client.id,
            ).length;
            const clientLogsCount = logs.filter(
              (l) => l.client_id === client.id,
            ).length;

            return (
              <Card
                key={client.id}
                className="p-5 flex flex-col justify-between gap-4 transition-all hover:border-hairline-focus"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: color,
                }}
              >
                <div className="flex flex-col gap-3">
                  {/* Card Header: Name + Code + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-headline-sm font-semibold text-fg truncate">
                        {client.name}
                      </span>
                      <span
                        className="font-mono text-mono-xs font-semibold px-2 py-0.5 rounded-[4px] border shrink-0"
                        style={{
                          color,
                          borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                        }}
                      >
                        {clientInitials(client.name, client.code)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <IconButton
                        label="Editar cliente"
                        variant="ghost"
                        onClick={() => handleOpenEdit(client)}
                        className="text-fg-secondary hover:text-fg"
                      >
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton
                        label="Eliminar cliente"
                        variant="ghost"
                        onClick={() => setDeletingClient(client)}
                        className="text-fg-muted hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </div>

                  {/* Metadata List */}
                  <div className="flex flex-col gap-2 pt-1 text-body-sm text-fg-secondary">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-primary shrink-0" />
                      <span>
                        Tarifa: <strong className="font-mono text-fg"><Money amount={client.hourly_rate} />/h</strong>
                      </span>
                    </div>

                    {client.billing_cycle && (
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 text-fg-muted shrink-0" />
                        <span>{client.billing_cycle}</span>
                      </div>
                    )}

                    {client.default_channel && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4 text-fg-muted shrink-0" />
                        <span className="font-mono text-xs">{client.default_channel}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between border-t border-hairline/60 pt-3 text-xs text-fg-muted font-mono">
                  <span>{clientMilestonesCount} hitos vinculados</span>
                  <span>{clientLogsCount} registros registrados</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sheet Modal: Create or PATCH Update Client */}
      <Sheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        description="Configurá los datos de facturación y el canal por defecto para el cliente."
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitForm}
              loading={createClientMutation.isPending || updateClientMutation.isPending}
            >
              {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="flex flex-col gap-4 py-2">
          {/* Client Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-ui text-fg-secondary">
              Nombre de la empresa / cliente <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Fintech Nova Inc."
              className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Client Code & Hourly Rate Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-ui text-fg-secondary">
                Código corto
              </label>
              <input
                type="text"
                maxLength={4}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Ej: FN"
                className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md font-mono text-fg uppercase placeholder:text-fg-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-ui text-fg-secondary">
                Tarifa por hora ($) <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="5"
                required
                value={formHourlyRate}
                onChange={(e) => setFormHourlyRate(e.target.value)}
                placeholder="85"
                className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md font-mono text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Default Channel */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-ui text-fg-secondary">
              Canal de comunicación por defecto
            </label>
            <input
              type="text"
              value={formChannel}
              onChange={(e) => setFormChannel(e.target.value)}
              placeholder="Ej: Slack #eng-core o Discord #dev"
              className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Billing Cycle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-ui text-fg-secondary">
              Ciclo de facturación
            </label>
            <select
              value={formBillingCycle}
              onChange={(e) => setFormBillingCycle(e.target.value)}
              className="h-10 rounded-control border border-hairline-strong bg-field px-3 text-body-md text-fg focus:border-primary focus:outline-none"
            >
              {BILLING_CYCLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Sheet>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deletingClient)}
        title="¿Eliminar cliente?"
        description={
          <span>
            ¿Estás seguro de que querés eliminar a{' '}
            <strong className="text-fg">{deletingClient?.name}</strong>? Esta acción no se puede deshacer y desvinculará sus registros y borradores.
          </span>
        }
        confirmLabel="Eliminar Cliente"
        destructive
        loading={deleteClientMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingClient(null)}
      />
    </div>
  );
}
