import { supabase } from '../config/supabase.js';

// Identificador de usuario por defecto para la sesión actual
export const DEFAULT_USER_ID = 'user-martin-123';
// UUID seeded/fallback para PostgreSQL si la columna user_id tiene restricción UUID
export const DEFAULT_USER_UUID = process.env.DEFAULT_USER_UUID || '00000000-0000-0000-0000-000000000123';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveUserId(userId = DEFAULT_USER_ID) {
  if (!userId || userId === DEFAULT_USER_ID) {
    return DEFAULT_USER_UUID;
  }
  return UUID_REGEX.test(userId) ? userId : DEFAULT_USER_UUID;
}

function formatClient(row) {
  if (!row) return null;
  return {
    ...row,
    hourly_rate: Number(row.hourly_rate)
  };
}

export const ClientModel = {
  /**
   * Obtiene todos los clientes asociados al usuario activo desde Supabase.
   */
  async findAll(userId = DEFAULT_USER_ID) {
    const targetUserId = resolveUserId(userId);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener los clientes: ${error.message}`);
    }
    return (data || []).map(formatClient);
  },

  /**
   * Busca un cliente por su identificador único y usuario desde Supabase.
   */
  async findById(id, userId = DEFAULT_USER_ID) {
    let query = supabase.from('clients').select('*').eq('id', id);
    if (userId) {
      query = query.eq('user_id', resolveUserId(userId));
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el cliente: ${error.message}`);
    }
    return formatClient(data);
  },

  /**
   * Registra un nuevo cliente en la tabla clients de Supabase.
   */
  async create(data, userId = DEFAULT_USER_ID) {
    const targetUserId = resolveUserId(userId);
    const payload = {
      user_id: targetUserId,
      name: data.name.trim(),
      code: data.code ? data.code.trim() : null,
      default_channel: data.default_channel ? data.default_channel.trim() : null,
      hourly_rate: Number(data.hourly_rate),
      billing_cycle: data.billing_cycle ? data.billing_cycle.trim() : null
    };
    if (data.id) payload.id = data.id;

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el cliente: ${error.message}`);
    }
    return formatClient(newClient);
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un cliente existente en Supabase.
   */
  async update(id, data, userId = DEFAULT_USER_ID) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.code !== undefined) payload.code = data.code ? data.code.trim() : null;
    if (data.default_channel !== undefined) payload.default_channel = data.default_channel ? data.default_channel.trim() : null;
    if (data.hourly_rate !== undefined) payload.hourly_rate = Number(data.hourly_rate);
    if (data.billing_cycle !== undefined) payload.billing_cycle = data.billing_cycle ? data.billing_cycle.trim() : null;

    let query = supabase.from('clients').update(payload).eq('id', id);
    if (userId) {
      query = query.eq('user_id', resolveUserId(userId));
    }
    const { data: updatedClient, error } = await query.select().maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el cliente: ${error.message}`);
    }
    return formatClient(updatedClient);
  },

  /**
   * Remueve un cliente de Supabase.
   */
  async delete(id, userId = DEFAULT_USER_ID) {
    let query = supabase.from('clients').delete().eq('id', id);
    if (userId) {
      query = query.eq('user_id', resolveUserId(userId));
    }
    const { data: deletedClient, error } = await query.select().maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar el cliente: ${error.message}`);
    }
    return formatClient(deletedClient);
  }
};
