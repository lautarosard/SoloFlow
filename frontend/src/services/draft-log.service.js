import axios from 'axios';

const BASE_URL = '/api/draft-logs';

/**
 * Obtiene todos los registros de borrador (draft logs).
 * Soporta filtros opcionales por query params (ej. { clientId }).
 * @param {Object} [params]
 * @returns {Promise<{ status: string, data: any }>}
 */
export const getAll = async (params) => {
  const response = await axios.get(BASE_URL, { params });
  return response.data;
};

/**
 * Obtiene un registro de borrador por su ID.
 * @param {string} id
 * @returns {Promise<{ status: string, data: any }>}
 */
export const getById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * Crea un nuevo registro de borrador.
 * @param {Object} draftLogData
 * @returns {Promise<{ status: string, data: any }>}
 */
export const create = async (draftLogData) => {
  const response = await axios.post(BASE_URL, draftLogData);
  return response.data;
};

/**
 * Actualiza parcialmente un registro de borrador usando exclusivamente PATCH.
 * @param {string} id
 * @param {Object} draftLogData
 * @returns {Promise<{ status: string, data: any }>}
 */
export const update = async (id, draftLogData) => {
  const response = await axios.patch(`${BASE_URL}/${id}`, draftLogData);
  return response.data;
};

/**
 * Elimina un registro de borrador por su ID.
 * @param {string} id
 * @returns {Promise<{ status: string, data: any }>}
 */
export const remove = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const draftLogService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
};

export default draftLogService;

