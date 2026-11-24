import { supabase } from '../config/supabase.js';

// Estados permitidos según el contrato de datos
export const DRAFT_LOG_STATUSES = ['pending', 'grouped', 'discarded'];

function formatDraftLog(row) {
  if (!row) return null;
  return {
    ...row,
    duration_minutes: Number(row.duration_minutes),
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

export const DraftLogModel = {
  /**
   * Obtiene todos los logs o filtra por clientId, milestoneId y status desde Supabase.
   */
  async findAll(filters = {}) {
    let query = supabase.from('draft_logs').select('*');

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters.milestoneId) {
      query = query.eq('milestone_id', filters.milestoneId);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        const statuses = filters.status.split(',').map((s) => s.trim());
        query = query.in('status', statuses);
      }
    }

    query = query.order('logged_at', { ascending: false });
    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener los registros borrador: ${error.message}`);
    }
    return (data || []).map(formatDraftLog);
  },

  /**
   * Busca un log por su ID desde Supabase.
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('draft_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el registro borrador: ${error.message}`);
    }
    return formatDraftLog(data);
  },

  /**
   * Registra un nuevo draft_log en Supabase.
   */
  async create(data) {
    const payload = {
      client_id: data.client_id,
      milestone_id: data.milestone_id || null,
      description: data.description.trim(),
      duration_minutes: Number(data.duration_minutes),
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || 'pending',
      is_client_visible: typeof data.is_client_visible === 'boolean' ? data.is_client_visible : false
    };
    if (data.id) payload.id = data.id;
    if (data.logged_at) payload.logged_at = new Date(data.logged_at).toISOString();

    const { data: newLog, error } = await supabase
      .from('draft_logs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el registro borrador: ${error.message}`);
    }
    return formatDraftLog(newLog);
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un log existente en Supabase.
   */
  async update(id, data) {
    const payload = {};
    if (data.client_id !== undefined) payload.client_id = data.client_id;
    if (data.milestone_id !== undefined) payload.milestone_id = data.milestone_id;
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.duration_minutes !== undefined) payload.duration_minutes = Number(data.duration_minutes);
    if (data.tags !== undefined) payload.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.logged_at !== undefined) payload.logged_at = new Date(data.logged_at).toISOString();
    if (data.status !== undefined) payload.status = data.status;
    if (data.is_client_visible !== undefined) payload.is_client_visible = Boolean(data.is_client_visible);

    const { data: updatedLog, error } = await supabase
      .from('draft_logs')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el registro borrador: ${error.message}`);
    }
    return formatDraftLog(updatedLog);
  },

  /**
   * Elimina un draft_log por su ID en Supabase.
   */
  async delete(id) {
    const { data: deletedLog, error } = await supabase
      .from('draft_logs')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar el registro borrador: ${error.message}`);
    }
    return formatDraftLog(deletedLog);
  }
};
