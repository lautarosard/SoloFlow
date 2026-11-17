/** Mirrors backend/src/models/client.model.js */
export interface Client {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  default_channel: string | null;
  hourly_rate: number;
  billing_cycle: string | null;
  created_at: string;
}

export interface CreateClientInput {
  name: string;
  hourly_rate: number;
  code?: string | null;
  default_channel?: string | null;
  billing_cycle?: string | null;
}

export type UpdateClientInput = Partial<CreateClientInput>;
