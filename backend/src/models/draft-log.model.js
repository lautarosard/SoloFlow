import crypto from 'node:crypto';

// Estados permitidos según el contrato de datos
export const DRAFT_LOG_STATUSES = ['pending', 'grouped', 'discarded'];

/**
 * Mocks iniciales en memoria según especificación de docs/modelo-datos.md.
 * 3 draft_logs vinculados a Fintech Nova (client_id: 'cli-fintech-01') con milestone_id en null.
 */
let draftLogs = [
  {
    id: 'log-4092',
    client_id: 'cli-fintech-01',
    milestone_id: null,
    description: 'Fix en middleware de autenticación JWT',
    duration_minutes: 90,
    tags: ['#Backend', '#Fix Crítico'],
    logged_at: new Date('2025-03-14T10:00:00.000Z').toISOString(),
    status: 'pending',
    is_client_visible: false,
    created_at: new Date('2025-03-14T10:00:00.000Z').toISOString()
  },
  {
    id: 'log-4085',
    client_id: 'cli-fintech-01',
    milestone_id: null,
    description: 'Setup de pipeline CI/CD en GitHub Actions',
    duration_minutes: 120,
    tags: ['#DevOps'],
    logged_at: new Date('2025-03-13T14:30:00.000Z').toISOString(),
    status: 'pending',
    is_client_visible: false,
    created_at: new Date('2025-03-13T14:30:00.000Z').toISOString()
  },
  {
    id: 'log-4079',
    client_id: 'cli-fintech-01',
    milestone_id: null,
    description: 'Reunión sync de arquitectura y spec de tokens',
    duration_minutes: 30,
    tags: ['#Reunión'],
    logged_at: new Date('2025-03-12T09:00:00.000Z').toISOString(),
    status: 'grouped',
    is_client_visible: false,
    created_at: new Date('2025-03-12T09:00:00.000Z').toISOString()
  }
];

export const DraftLogModel = {
  /**
   * Obtiene todos los logs o filtra por clientId si se especifica.
   */
  async findAll(filters = {}) {
    let results = [...draftLogs];
    if (filters.clientId) {
      results = results.filter((log) => log.client_id === filters.clientId);
    }
    return results;
  },

  /**
   * Busca un log por su ID.
   */
  async findById(id) {
    const log = draftLogs.find((l) => l.id === id);
    return log || null;
  },

  /**
   * Registra un nuevo draft_log con valores por defecto y auditoría.
   */
  async create(data) {
    const now = new Date().toISOString();
    const newLog = {
      id: data.id || `log-${crypto.randomUUID().slice(0, 8)}`,
      client_id: data.client_id,
      milestone_id: data.milestone_id || null,
      description: data.description.trim(),
      duration_minutes: Number(data.duration_minutes),
      tags: Array.isArray(data.tags) ? data.tags : [],
      logged_at: data.logged_at ? new Date(data.logged_at).toISOString() : now,
      status: data.status || 'pending',
      is_client_visible: typeof data.is_client_visible === 'boolean' ? data.is_client_visible : false,
      created_at: now
    };
    draftLogs.push(newLog);
    return newLog;
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un log existente.
   */
  async update(id, data) {
    const index = draftLogs.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const current = draftLogs[index];
    const updated = {
      ...current,
      ...(data.client_id !== undefined && { client_id: data.client_id }),
      ...(data.milestone_id !== undefined && { milestone_id: data.milestone_id }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.duration_minutes !== undefined && { duration_minutes: Number(data.duration_minutes) }),
      ...(data.tags !== undefined && { tags: Array.isArray(data.tags) ? data.tags : current.tags }),
      ...(data.logged_at !== undefined && { logged_at: new Date(data.logged_at).toISOString() }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.is_client_visible !== undefined && { is_client_visible: Boolean(data.is_client_visible) })
    };

    draftLogs[index] = updated;
    return updated;
  },

  /**
   * Elimina un draft_log por su ID.
   */
  async delete(id) {
    const index = draftLogs.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const [deleted] = draftLogs.splice(index, 1);
    return deleted;
  }
};
