import { http } from './http';
import type { ApiSuccess, DeleteResult } from '../types/api';
import type { Client, CreateClientInput, UpdateClientInput } from '../types/client';

const BASE_URL = '/clients';

export const getAll = async (): Promise<ApiSuccess<Client[]>> => {
  const response = await http.get<ApiSuccess<Client[]>>(BASE_URL);
  return response.data;
};

export const getById = async (id: string): Promise<ApiSuccess<Client>> => {
  const response = await http.get<ApiSuccess<Client>>(`${BASE_URL}/${id}`);
  return response.data;
};

export const create = async (input: CreateClientInput): Promise<ApiSuccess<Client>> => {
  const response = await http.post<ApiSuccess<Client>>(BASE_URL, input);
  return response.data;
};

/** Partial update — the API only supports PATCH. */
export const update = async (id: string, input: UpdateClientInput): Promise<ApiSuccess<Client>> => {
  const response = await http.patch<ApiSuccess<Client>>(`${BASE_URL}/${id}`, input);
  return response.data;
};

export const remove = async (id: string): Promise<ApiSuccess<DeleteResult>> => {
  const response = await http.delete<ApiSuccess<DeleteResult>>(`${BASE_URL}/${id}`);
  return response.data;
};

export const clientService = { getAll, getById, create, update, remove };

export default clientService;
