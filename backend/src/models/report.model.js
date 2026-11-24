import crypto from 'node:crypto';
import { supabase } from '../config/supabase.js';

// Estados y tonos permitidos según el contrato de datos
export const REPORT_STATUSES = ['draft', 'approved', 'dispatched'];
export const EXECUTIVE_TONES = ['roi_business', 'tech_exec', 'bullets'];

function formatReport(row) {
  if (!row) return null;
  return {
    ...row,
    total_billable_hours: Number(row.total_billable_hours) || 0,
    hourly_rate_snapshot: Number(row.hourly_rate_snapshot) || 0,
    total_amount: Number(row.total_amount) || 0,
    is_public_enabled: Boolean(row.is_public_enabled)
  };
}

export const ReportModel = {
  /**
   * Obtiene todos los reportes desde Supabase. Soporta filtros por clientId y status.
   */
  async findAll(filters = {}) {
    let query = supabase.from('reports').select('*');

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

    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener los reportes: ${error.message}`);
    }
    return (data || []).map(formatReport);
  },

  /**
   * Busca un reporte por su ID desde Supabase.
   */
  async findById(id) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener el reporte: ${error.message}`);
    }
    return formatReport(data);
  },

  /**
   * Busca un reporte por su public_token (para enlace público) desde Supabase.
   */
  async findByToken(token) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('public_token', token)
      .eq('is_public_enabled', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar reporte por token: ${error.message}`);
    }
    return formatReport(data);
  },

  /**
   * Genera el próximo código secuencial de reporte.
   */
  async nextReportCode() {
    const year = new Date().getFullYear();
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    const total = error || count == null ? 0 : count;
    return `RPT-${year}-${String(total + 1).padStart(3, '0')}`;
  },

  /**
   * Crea un nuevo reporte en Supabase con auditoría y campos calculados.
   */
  async create(data) {
    const reportCode = data.report_code || (await this.nextReportCode());
    const payload = {
      client_id: data.client_id,
      report_code: reportCode,
      period_start: data.period_start,
      period_end: data.period_end,
      executive_tone: data.executive_tone || 'roi_business',
      total_billable_hours: Number(data.total_billable_hours) || 0,
      hourly_rate_snapshot: Number(data.hourly_rate_snapshot) || 0,
      total_amount: Number(data.total_amount) || 0,
      markdown_preview: data.markdown_preview || null,
      public_token: data.public_token || crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      is_public_enabled: typeof data.is_public_enabled === 'boolean' ? data.is_public_enabled : false,
      expires_at: data.expires_at || null,
      status: data.status || 'approved'
    };
    if (data.id) payload.id = data.id;

    const { data: newReport, error } = await supabase
      .from('reports')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el reporte: ${error.message}`);
    }
    return formatReport(newReport);
  },

  /**
   * Aplica actualización parcial (PATCH) sobre un reporte existente en Supabase.
   */
  async update(id, data) {
    const payload = {};
    if (data.executive_tone !== undefined) payload.executive_tone = data.executive_tone;
    if (data.markdown_preview !== undefined) payload.markdown_preview = data.markdown_preview;
    if (data.is_public_enabled !== undefined) payload.is_public_enabled = Boolean(data.is_public_enabled);
    if (data.expires_at !== undefined) payload.expires_at = data.expires_at;
    if (data.status !== undefined) payload.status = data.status;
    if (data.total_billable_hours !== undefined) payload.total_billable_hours = Number(data.total_billable_hours);
    if (data.hourly_rate_snapshot !== undefined) payload.hourly_rate_snapshot = Number(data.hourly_rate_snapshot);
    if (data.total_amount !== undefined) payload.total_amount = Number(data.total_amount);
    if (data.public_token !== undefined) payload.public_token = data.public_token;

    const { data: updatedReport, error } = await supabase
      .from('reports')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar el reporte: ${error.message}`);
    }
    return formatReport(updatedReport);
  },

  /**
   * Elimina un reporte por su ID en Supabase.
   */
  async delete(id) {
    const { data: deletedReport, error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al eliminar el reporte: ${error.message}`);
    }
    return formatReport(deletedReport);
  }
};
