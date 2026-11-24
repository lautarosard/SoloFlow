import crypto from 'node:crypto';
import { ReportModel, REPORT_STATUSES, EXECUTIVE_TONES } from '../models/report.model.js';
import { ClientModel } from '../models/client.model.js';
import { MilestoneModel } from '../models/milestone.model.js';
import { DraftLogModel } from '../models/draft-log.model.js';

export const reportController = {
  /**
   * Obtiene la lista de reportes. Soporta filtros por query params: ?clientId=, ?status=
   */
  async getAll(req, res) {
    try {
      const { clientId, status } = req.query;
      const reports = await ReportModel.findAll({ clientId, status });

      return res.status(200).json({
        status: 'success',
        data: reports
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener los reportes' }
      });
    }
  },

  /**
   * Obtiene un reporte por su ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const report = await ReportModel.findById(id);

      if (!report) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Reporte con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener el reporte' }
      });
    }
  },

  /**
   * Crea un nuevo reporte.
   * Congela hourly_rate_snapshot del cliente, calcula total_billable_hours
   * a partir de los milestones vinculados, genera total_amount y public_token,
   * y marca los milestones como 'completed' con el report_id asignado.
   */
  async create(req, res) {
    try {
      const {
        client_id,
        period_start,
        period_end,
        executive_tone = 'roi_business',
        milestone_ids,
        markdown_preview
      } = req.body;

      // Validación: client_id requerido
      if (!client_id || typeof client_id !== 'string' || client_id.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "client_id" es obligatorio' }
        });
      }

      // Validación: period_start requerido
      if (!period_start) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "period_start" es obligatorio' }
        });
      }

      // Validación: period_end requerido
      if (!period_end) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "period_end" es obligatorio' }
        });
      }

      // Validación: executive_tone enum
      if (executive_tone && !EXECUTIVE_TONES.includes(executive_tone)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "executive_tone" debe ser uno de los siguientes valores: ${EXECUTIVE_TONES.join(', ')}`
          }
        });
      }

      // Validación: milestone_ids requerido
      if (!Array.isArray(milestone_ids) || milestone_ids.length === 0) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "milestone_ids" es obligatorio y debe ser un array no vacío' }
        });
      }

      // Buscar el cliente para congelar la tarifa
      const client = await ClientModel.findById(client_id);
      if (!client) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Cliente con ID '${client_id}' no encontrado` }
        });
      }

      // Validar que todos los milestones existen y pertenecen al cliente
      const milestones = [];
      for (const msId of milestone_ids) {
        const milestone = await MilestoneModel.findById(msId);
        if (!milestone) {
          return res.status(404).json({
            status: 'error',
            data: { message: `Hito con ID '${msId}' no encontrado` }
          });
        }
        if (milestone.client_id !== client_id) {
          return res.status(400).json({
            status: 'error',
            data: { message: `El hito '${msId}' no pertenece al cliente '${client_id}'` }
          });
        }
        milestones.push(milestone);
      }

      // Calcular total_billable_hours a partir de los logs grouped de los milestones
      const allLogs = await DraftLogModel.findAll();
      const milestoneLogs = allLogs.filter(
        (l) => milestone_ids.includes(l.milestone_id) && l.status === 'grouped'
      );
      const totalMinutes = milestoneLogs.reduce((sum, l) => sum + l.duration_minutes, 0);
      const totalBillableHours = +(totalMinutes / 60).toFixed(2);

      // Congelar tarifa y calcular monto
      const hourlyRateSnapshot = client.hourly_rate;
      const totalAmount = +(totalBillableHours * hourlyRateSnapshot).toFixed(2);

      // Generar public_token
      const publicToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

      // Construir markdown_preview básico si no se proporcionó
      const finalMarkdown = markdown_preview || buildMarkdownPreview({
        client,
        milestones,
        totalBillableHours,
        hourlyRateSnapshot,
        totalAmount,
        periodStart: period_start,
        periodEnd: period_end
      });

      // Crear el reporte
      const newReport = await ReportModel.create({
        client_id,
        period_start,
        period_end,
        executive_tone,
        total_billable_hours: totalBillableHours,
        hourly_rate_snapshot: hourlyRateSnapshot,
        total_amount: totalAmount,
        markdown_preview: finalMarkdown,
        public_token: publicToken,
        is_public_enabled: false,
        status: 'approved'
      });

      // Marcar los milestones como 'completed' y asignar report_id
      for (const ms of milestones) {
        await MilestoneModel.update(ms.id, {
          report_id: newReport.id,
          status: 'completed'
        });
      }

      return res.status(201).json({
        status: 'success',
        data: newReport
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al crear el reporte' }
      });
    }
  },

  /**
   * Actualiza parcialmente un reporte mediante PATCH.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        executive_tone,
        markdown_preview,
        is_public_enabled,
        expires_at,
        status
      } = req.body;

      // Validación si se envía executive_tone
      if (executive_tone !== undefined && !EXECUTIVE_TONES.includes(executive_tone)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "executive_tone" debe ser uno de los siguientes valores: ${EXECUTIVE_TONES.join(', ')}`
          }
        });
      }

      // Validación si se envía status
      if (status !== undefined && !REPORT_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "status" debe ser uno de los siguientes valores: ${REPORT_STATUSES.join(', ')}`
          }
        });
      }

      const updatedReport = await ReportModel.update(id, {
        executive_tone,
        markdown_preview,
        is_public_enabled,
        expires_at,
        status
      });

      if (!updatedReport) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Reporte con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: updatedReport
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al actualizar el reporte' }
      });
    }
  },

  /**
   * Habilita el enlace público de un reporte con expiración configurable.
   */
  async enablePublicLink(req, res) {
    try {
      const { id } = req.params;
      const { days = 7 } = req.body;

      const report = await ReportModel.findById(id);
      if (!report) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Reporte con ID '${id}' no encontrado` }
        });
      }

      // Generar o rotar public_token
      const publicToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const updatedReport = await ReportModel.update(id, {
        public_token: publicToken,
        is_public_enabled: true,
        expires_at: expiresAt
      });

      return res.status(200).json({
        status: 'success',
        data: updatedReport
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al habilitar el enlace público' }
      });
    }
  },

  /**
   * Elimina un reporte por su ID.
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deletedReport = await ReportModel.delete(id);

      if (!deletedReport) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Reporte con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          id: deletedReport.id,
          message: 'Reporte eliminado correctamente'
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al eliminar el reporte' }
      });
    }
  }
};

/**
 * Genera un markdown preview básico a partir de los datos del reporte.
 */
function buildMarkdownPreview({ client, milestones, totalBillableHours, hourlyRateSnapshot, totalAmount, periodStart, periodEnd }) {
  const lines = [
    `# Reporte — ${client.name}`,
    `**Período:** ${periodStart} → ${periodEnd}`,
    `**Horas facturables:** ${totalBillableHours}h`,
    `**Tarifa:** $${hourlyRateSnapshot}/h`,
    `**Total:** $${totalAmount}`,
    '',
    '## Hitos completados',
    ''
  ];

  for (const ms of milestones) {
    lines.push(`### ${ms.title}`);
    if (ms.description) {
      lines.push(ms.description);
    }
    if (ms.impact_bullets && ms.impact_bullets.length > 0) {
      for (const bullet of ms.impact_bullets) {
        lines.push(`- ${bullet}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
