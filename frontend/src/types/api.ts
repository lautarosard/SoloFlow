/** Standard backend envelope: `{ status, data }`. Errors carry `data.message`. */
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}

export interface ApiError {
  status: 'error';
  data: { message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface DeleteResult {
  id: string;
  message: string;
}
