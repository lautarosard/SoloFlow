import { supabase } from '../config/supabase.js';

// Estados permitidos según el contrato de datos
export const MILESTONE_STATUSES = ['active', 'in_review', 'completed'];

function formatMilestone(row) {
  if (!row) return null;
  return {
    ...row,
    consolidated_hours: Number(row.consolidated_hours) || 0,
    estimated_hours: row.estimated_hours != null ? Number(row.estimated_hours) : null,
    impact_bullets: Array.isArray(row.impact_bullets) ? row.impact_bullets : []
  };
}

export const MilestoneModel = {
  /**
   * Obtiene todos los milestones desde Supabase. Soporta filtros por clientId, status y reportId.
   */
  async findAll(filters = {}) {
    let query = supabase.from('milestones').select('*');

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        const statuses = filters.status.split(',').map((s) => s.trim());
        query = query.in('status', statuses);
      }
    }
    if (filters.reportId) {
      query = query.eq('report_id', filters.reportId);
    }

    query = query.order('created_at', { ascending: true });
    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener los hitos: ${error.message}`);
    }
    return (data || []).map(formatMilestone);
  },

  /**
   * Busca un milestone por su ID desde Supabase.
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el hito: ${error.message}`);
    }
    return formatMilestone(data);
  },

  /**
   * Crea un nuevo milestone en la tabla milestones de Supabase.
   */
  async create(data) {
    const payload = {
      client_id: data.client_id,
      report_id: data.report_id || null,
      code: data.code || null,
      category: data.category ? data.category.trim() : null,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      impact_bullets: Array.isArray(data.impact_bullets) ? data.impact_bullets : [],
      consolidated_hours: Number(data.consolidated_hours) || 0,
      estimated_hours: data.estimated_hours != null ? Number(data.estimated_hours) : null,
      status: data.status || 'active'
    };
    if (data.id) payload.id = data.id;

    const { data: newMilestone, error } = await supabase
      .from('milestones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el hito: ${error.message}`);
    }
    return formatMilestone(newMilestone);
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un milestone existente en Supabase.
   */
  async update(id, data) {
    const payload = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.category !== undefined) payload.category = data.category ? data.category.trim() : null;
    if (data.description !== undefined) payload.description = data.description ? data.description.trim() : null;
    if (data.impact_bullets !== undefined) payload.impact_bullets = Array.isArray(data.impact_bullets) ? data.impact_bullets : [];
    if (data.consolidated_hours !== undefined) payload.consolidated_hours = Number(data.consolidated_hours);
    if (data.estimated_hours !== undefined) payload.estimated_hours = data.estimated_hours != null ? Number(data.estimated_hours) : null;
    if (data.status !== undefined) payload.status = data.status;
    if (data.report_id !== undefined) payload.report_id = data.report_id;
    if (data.code !== undefined) payload.code = data.code;

    const { data: updatedMilestone, error } = await supabase
      .from('milestones')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el hito: ${error.message}`);
    }
    return formatMilestone(updatedMilestone);
  },

  /**
   * Elimina un milestone por su ID en Supabase.
   */
  async delete(id) {
    const { data: deletedMilestone, error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar el hito: ${error.message}`);
    }
    return formatMilestone(deletedMilestone);
  }
};
