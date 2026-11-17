import { http } from './http';
import type { ApiSuccess, DeleteResult } from '../types/api';
import type {
  CreateDraftLogInput,
  DraftLog,
  DraftLogFilters,
  UpdateDraftLogInput,
} from '../types/draft-log';

const BASE_URL = '/draft-logs';

/** Lists draft logs, optionally filtered by client (`?clientId=`). */
export const getAll = async (filters?: DraftLogFilters): Promise<ApiSuccess<DraftLog[]>> => {
  const response = await http.get<ApiSuccess<DraftLog[]>>(BASE_URL, { params: filters });
  return response.data;
};

export const getById = async (id: string): Promise<ApiSuccess<DraftLog>> => {
  const response = await http.get<ApiSuccess<DraftLog>>(`${BASE_URL}/${id}`);
  return response.data;
};

export const create = async (input: CreateDraftLogInput): Promise<ApiSuccess<DraftLog>> => {
  const response = await http.post<ApiSuccess<DraftLog>>(BASE_URL, input);
  return response.data;
};

/** Partial update — the API only supports PATCH. */
export const update = async (
  id: string,
  input: UpdateDraftLogInput,
): Promise<ApiSuccess<DraftLog>> => {
  const response = await http.patch<ApiSuccess<DraftLog>>(`${BASE_URL}/${id}`, input);
  return response.data;
};

export const remove = async (id: string): Promise<ApiSuccess<DeleteResult>> => {
  const response = await http.delete<ApiSuccess<DeleteResult>>(`${BASE_URL}/${id}`);
  return response.data;
};

export const draftLogService = { getAll, getById, create, update, remove };

export default draftLogService;
