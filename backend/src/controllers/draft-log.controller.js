import { DraftLogModel, DRAFT_LOG_STATUSES } from '../models/draft-log.model.js';

export const draftLogController = {
  /**
   * Obtiene la lista de draft_logs. Soporta filtro opcional por query param ?clientId=
   */
  async getAll(req, res) {
    try {
      const { clientId } = req.query;
      const logs = await DraftLogModel.findAll({ clientId });

      return res.status(200).json({
        status: 'success',
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener los registros borrador' }
      });
    }
  },

  /**
   * Obtiene un draft_log por su ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const log = await DraftLogModel.findById(id);

      if (!log) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Registro borrador con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: log
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener el registro borrador' }
      });
    }
  },

  /**
   * Crea un nuevo draft_log con validación de client_id, description, duration_minutes > 0 y status enum.
   */
  async create(req, res) {
    try {
      const {
        client_id,
        description,
        duration_minutes,
        tags,
        logged_at,
        status = 'pending',
        is_client_visible,
        milestone_id = null
      } = req.body;

      // Validación: client_id requerido
      if (!client_id || typeof client_id !== 'string' || client_id.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "client_id" es obligatorio' }
        });
      }

      // Validación: description requerida
      if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "description" es obligatorio' }
        });
      }

      // Validación: duration_minutes requerido y > 0
      if (
        duration_minutes === undefined ||
        duration_minutes === null ||
        duration_minutes === '' ||
        isNaN(Number(duration_minutes)) ||
        Number(duration_minutes) <= 0
      ) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "duration_minutes" es obligatorio y debe ser un número mayor a 0' }
        });
      }

      // Validación: status enum ('pending', 'grouped', 'discarded')
      if (status && !DRAFT_LOG_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "status" debe ser uno de los siguientes valores: ${DRAFT_LOG_STATUSES.join(', ')}`
          }
        });
      }

      const newLog = await DraftLogModel.create({
        client_id: client_id.trim(),
        milestone_id,
        description,
        duration_minutes: Number(duration_minutes),
        tags,
        logged_at,
        status,
        is_client_visible
      });

      return res.status(201).json({
        status: 'success',
        data: newLog
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al crear el registro borrador' }
      });
    }
  },

  /**
   * Actualiza parcialmente un draft_log mediante PATCH.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        client_id,
        milestone_id,
        description,
        duration_minutes,
        tags,
        logged_at,
        status,
        is_client_visible
      } = req.body;

      // Validación si se envía client_id
      if (client_id !== undefined && (typeof client_id !== 'string' || client_id.trim() === '')) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "client_id" no puede estar vacío' }
        });
      }

      // Validación si se envía description
      if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "description" no puede estar vacío' }
        });
      }

      // Validación si se envía duration_minutes
      if (duration_minutes !== undefined) {
        if (
          duration_minutes === null ||
          duration_minutes === '' ||
          isNaN(Number(duration_minutes)) ||
          Number(duration_minutes) <= 0
        ) {
          return res.status(400).json({
            status: 'error',
            data: { message: 'El campo "duration_minutes" debe ser un número mayor a 0' }
          });
        }
      }

      // Validación si se envía status enum
      if (status !== undefined && !DRAFT_LOG_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          data: {
            message: `El campo "status" debe ser uno de los siguientes valores: ${DRAFT_LOG_STATUSES.join(', ')}`
          }
        });
      }

      const updatedLog = await DraftLogModel.update(id, {
        client_id,
        milestone_id,
        description,
        duration_minutes,
        tags,
        logged_at,
        status,
        is_client_visible
      });

      if (!updatedLog) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Registro borrador con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: updatedLog
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al actualizar el registro borrador' }
      });
    }
  },

  /**
   * Elimina un draft_log por su ID.
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deletedLog = await DraftLogModel.delete(id);

      if (!deletedLog) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Registro borrador con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          id: deletedLog.id,
          message: 'Registro borrador eliminado correctamente'
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al eliminar el registro borrador' }
      });
    }
  }
};
