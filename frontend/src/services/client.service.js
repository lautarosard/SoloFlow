import axios from 'axios';

const BASE_URL = '/api/clients';

/**
 * Obtiene todos los clientes.
 * @param {Object} [params]
 * @returns {Promise<{ status: string, data: any }>}
 */
export const getAll = async (params) => {
  const response = await axios.get(BASE_URL, { params });
  return response.data;
};

/**
 * Obtiene un cliente por su ID.
 * @param {string} id
 * @returns {Promise<{ status: string, data: any }>}
 */
export const getById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * Crea un nuevo cliente.
 * @param {Object} clientData
 * @returns {Promise<{ status: string, data: any }>}
 */
export const create = async (clientData) => {
  const response = await axios.post(BASE_URL, clientData);
  return response.data;
};

/**
 * Actualiza parcialmente un cliente usando exclusivamente PATCH.
 * @param {string} id
 * @param {Object} clientData
 * @returns {Promise<{ status: string, data: any }>}
 */
export const update = async (id, clientData) => {
  const response = await axios.patch(`${BASE_URL}/${id}`, clientData);
  return response.data;
};

/**
 * Elimina un cliente por su ID.
 * @param {string} id
 * @returns {Promise<{ status: string, data: any }>}
 */
export const remove = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const clientService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  remove,
};

export default clientService;

