import { ClientModel } from '../models/client.model.js';

export const clientController = {
  /**
   * Obtiene todos los clientes del usuario activo.
   */
  async getAll(req, res) {
    try {
      const clients = await ClientModel.findAll();
      return res.status(200).json({
        status: 'success',
        data: clients
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener los clientes' }
      });
    }
  },

  /**
   * Obtiene un cliente por su ID.
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const client = await ClientModel.findById(id);

      if (!client) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Cliente con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: client
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al obtener el cliente' }
      });
    }
  },

  /**
   * Crea un nuevo cliente con validación de campos obligatorios y tarifa no negativa.
   */
  async create(req, res) {
    try {
      const { name, hourly_rate, code, default_channel, billing_cycle } = req.body;

      // Validación de campo obligatorio 'name'
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "name" es obligatorio' }
        });
      }

      // Validación de campo obligatorio y valor numérico de 'hourly_rate' (debe ser >= 0)
      if (
        hourly_rate === undefined ||
        hourly_rate === null ||
        hourly_rate === '' ||
        isNaN(Number(hourly_rate)) ||
        Number(hourly_rate) < 0
      ) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "hourly_rate" es obligatorio y debe ser un número mayor o igual a 0' }
        });
      }

      const newClient = await ClientModel.create({
        name,
        hourly_rate,
        code,
        default_channel,
        billing_cycle
      });

      return res.status(201).json({
        status: 'success',
        data: newClient
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al crear el cliente' }
      });
    }
  },

  /**
   * Actualiza parcialmente un cliente mediante PATCH.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, hourly_rate, code, default_channel, billing_cycle } = req.body;

      // Validación si se envía 'name'
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({
          status: 'error',
          data: { message: 'El campo "name" no puede estar vacío' }
        });
      }

      // Validación si se envía 'hourly_rate'
      if (hourly_rate !== undefined) {
        if (hourly_rate === null || hourly_rate === '' || isNaN(Number(hourly_rate)) || Number(hourly_rate) < 0) {
          return res.status(400).json({
            status: 'error',
            data: { message: 'El campo "hourly_rate" debe ser un número mayor o igual a 0' }
          });
        }
      }

      const updatedClient = await ClientModel.update(id, {
        name,
        hourly_rate,
        code,
        default_channel,
        billing_cycle
      });

      if (!updatedClient) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Cliente con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: updatedClient
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al actualizar el cliente' }
      });
    }
  },

  /**
   * Elimina un cliente por su ID.
   */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const deletedClient = await ClientModel.delete(id);

      if (!deletedClient) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Cliente con ID '${id}' no encontrado` }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          id: deletedClient.id,
          message: 'Cliente eliminado correctamente'
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Error al eliminar el cliente' }
      });
    }
  }
};
