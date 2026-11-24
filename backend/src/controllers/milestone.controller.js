import { MilestoneModel, MILESTONE_STATUSES } from '../models/milestone.model.js';
import { DraftLogModel } from '../models/draft-log.model.js';

export const milestoneController = {
  /**
   * Obtiene la lista de milestones. Soporta filtros por query params: ?clientId=, ?status=, ?reportId=
   */
  async getAll(req, res) {
    try {
      const { clientId, status, reportId } = req.query;
      const milestones = await MilestoneModel.findAll({ clientId, status, reportId });

      return res.status(200).json({
        status: 'success',
        data: milestones
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener los hitos' }
      });
    }
  },

  /**
   * Obtiene un milestone por su ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const milestone = await MilestoneModel.findById(id);

      if (!milestone) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Hito con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: milestone
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener el hito' }
      });
    }
  },

  /**
   * Crea un nuevo milestone con validación de campos obligatorios.
   */
  async create(req, res) {
    try {
      const {
        client_id,
        title,
        code,
        category,
        description,
        impact_bullets,
        estimated_hours,
        status = 'active'
      } = req.body;

      // Validación: client_id requerido
      if (!client_id || typeof client_id !== 'string' || client_id.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "client_id" es obligatorio' }
        });
      }

      // Validación: title requerido
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "title" es obligatorio' }
        });
      }

      // Validación: status enum
      if (status && !MILESTONE_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "status" debe ser uno de los siguientes valores: ${MILESTONE_STATUSES.join(', ')}`
          }
        });
      }

      // Validación: estimated_hours >= 0 si se envía
      if (estimated_hours !== undefined && estimated_hours !== null) {
        if (isNaN(Number(estimated_hours)) || Number(estimated_hours) < 0) {
          return res.status(400).json({
            status: 'error',
            data: { message: 'El campo "estimated_hours" debe ser un número mayor o igual a 0' }
          });
        }
      }

      const newMilestone = await MilestoneModel.create({
        client_id: client_id.trim(),
        title,
        code,
        category,
        description,
        impact_bullets,
        estimated_hours,
        status
      });

      return res.status(201).json({
        status: 'success',
        data: newMilestone
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al crear el hito' }
      });
    }
  },

  /**
   * Actualiza parcialmente un milestone mediante PATCH.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        category,
        description,
        impact_bullets,
        consolidated_hours,
        estimated_hours,
        status,
        report_id,
        code
      } = req.body;

      // Validación si se envía title
      if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "title" no puede estar vacío' }
        });
      }

      // Validación si se envía status
      if (status !== undefined && !MILESTONE_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "status" debe ser uno de los siguientes valores: ${MILESTONE_STATUSES.join(', ')}`
          }
        });
      }

      // Validación si se envía estimated_hours
      if (estimated_hours !== undefined && estimated_hours !== null) {
        if (isNaN(Number(estimated_hours)) || Number(estimated_hours) < 0) {
          return res.status(400).json({
            status: 'error',
            data: { message: 'El campo "estimated_hours" debe ser un número mayor o igual a 0' }
          });
        }
      }

      const updatedMilestone = await MilestoneModel.update(id, {
        title,
        category,
        description,
        impact_bullets,
        consolidated_hours,
        estimated_hours,
        status,
        report_id,
        code
      });

      if (!updatedMilestone) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Hito con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: updatedMilestone
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al actualizar el hito' }
      });
    }
  },

  /**
   * Asigna un array de draft_log IDs a un milestone.
   * Marca cada log como status: 'grouped' con el milestone_id correspondiente
   * y recalcula consolidated_hours del milestone.
   */
  async assignLogs(req, res) {
    try {
      const { id } = req.params;
      const { log_ids } = req.body;

      // Validar que el milestone existe
      const milestone = await MilestoneModel.findById(id);
      if (!milestone) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Hito con ID '${id}' no encontrado` }
        });
      }

      // Validar log_ids
      if (!Array.isArray(log_ids) || log_ids.length === 0) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "log_ids" es obligatorio y debe ser un array no vacío' }
        });
      }

      // Validar que todos los logs existen
      const logs = [];
      for (const logId of log_ids) {
        const log = await DraftLogModel.findById(logId);
        if (!log) {
          return res.status(404).json({
            status: 'error',
            data: { message: `Registro borrador con ID '${logId}' no encontrado` }
          });
        }
        logs.push(log);
      }

      // Asignar cada log al milestone y marcarlo como 'grouped'
      for (const log of logs) {
        await DraftLogModel.update(log.id, {
          milestone_id: id,
          status: 'grouped'
        });
      }

      // Recalcular consolidated_hours: sumar duration_minutes de todos los logs asignados a este milestone
      const allLogs = await DraftLogModel.findAll();
      const milestoneLogMinutes = allLogs
        .filter((l) => l.milestone_id === id && l.status === 'grouped')
        .reduce((sum, l) => sum + l.duration_minutes, 0);

      const consolidatedHours = +(milestoneLogMinutes / 60).toFixed(2);

      const updatedMilestone = await MilestoneModel.update(id, {
        consolidated_hours: consolidatedHours
      });

      return res.status(200).json({
        status: 'success',
        data: updatedMilestone
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al asignar registros al hito' }
      });
    }
  },

  /**
   * Elimina un milestone por su ID.
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deletedMilestone = await MilestoneModel.delete(id);

      if (!deletedMilestone) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Hito con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          id: deletedMilestone.id,
          message: 'Hito eliminado correctamente'
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al eliminar el hito' }
      });
    }
  }
};
