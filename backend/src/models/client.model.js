import crypto from 'node:crypto';

// Identificador de usuario por defecto para la sesión actual
export const DEFAULT_USER_ID = 'user-martin-123';

/**
 * Mocks iniciales en memoria según especificación de docs/modelo-datos.md.
 * En el hito C12 esta capa se reemplazará por consultas a Supabase.
 */
let clients = [
  {
    id: 'cli-fintech-01',
    user_id: DEFAULT_USER_ID,
    name: 'Fintech Nova Inc.',
    code: 'FN',
    hourly_rate: 85.00,
    default_channel: 'Slack #eng-core',
    billing_cycle: 'Facturación quincenal',
    created_at: new Date('2025-03-01T10:00:00.000Z').toISOString()
  },
  {
    id: 'cli-health-02',
    user_id: DEFAULT_USER_ID,
    name: 'HealthPulse',
    code: 'HP',
    hourly_rate: 90.00,
    default_channel: 'Discord #api-dev',
    billing_cycle: 'Facturación quincenal',
    created_at: new Date('2025-03-05T14:30:00.000Z').toISOString()
  }
];

export const ClientModel = {
  /**
   * Obtiene todos los clientes asociados al usuario activo.
   */
  async findAll(userId = DEFAULT_USER_ID) {
    return clients.filter((client) => client.user_id === userId);
  },

  /**
   * Busca un cliente por su identificador único y usuario.
   */
  async findById(id, userId = DEFAULT_USER_ID) {
    const client = clients.find((c) => c.id === id && c.user_id === userId);
    return client || null;
  },

  /**
   * Registra un nuevo cliente generando id y fecha de auditoría.
   */
  async create(data, userId = DEFAULT_USER_ID) {
    const newClient = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: data.name.trim(),
      code: data.code ? data.code.trim() : null,
      default_channel: data.default_channel ? data.default_channel.trim() : null,
      hourly_rate: Number(data.hourly_rate),
      billing_cycle: data.billing_cycle ? data.billing_cycle.trim() : null,
      created_at: new Date().toISOString()
    };
    clients.push(newClient);
    return newClient;
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un cliente existente.
   */
  async update(id, data, userId = DEFAULT_USER_ID) {
    const index = clients.findIndex((c) => c.id === id && c.user_id === userId);
    if (index === -1) return null;

    const current = clients[index];
    const updated = {
      ...current,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.code !== undefined && { code: data.code ? data.code.trim() : null }),
      ...(data.default_channel !== undefined && { default_channel: data.default_channel ? data.default_channel.trim() : null }),
      ...(data.hourly_rate !== undefined && { hourly_rate: Number(data.hourly_rate) }),
      ...(data.billing_cycle !== undefined && { billing_cycle: data.billing_cycle ? data.billing_cycle.trim() : null })
    };

    clients[index] = updated;
    return updated;
  },

  /**
   * Remueve un cliente del almacenamiento en memoria.
   */
  async delete(id, userId = DEFAULT_USER_ID) {
    const index = clients.findIndex((c) => c.id === id && c.user_id === userId);
    if (index === -1) return null;

    const [deleted] = clients.splice(index, 1);
    return deleted;
  }
};
