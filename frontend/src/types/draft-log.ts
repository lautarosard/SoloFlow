/** Mirrors backend/src/models/draft-log.model.js */
export const DRAFT_LOG_STATUSES = ['pending', 'grouped', 'discarded'] as const;
export type DraftLogStatus = (typeof DRAFT_LOG_STATUSES)[number];

export interface DraftLog {
  id: string;
  client_id: string;
  milestone_id: string | null;
  description: string;
  duration_minutes: number;
  tags: string[];
  logged_at: string;
  status: DraftLogStatus;
  is_client_visible: boolean;
  created_at: string;
}

export interface CreateDraftLogInput {
  client_id: string;
  description: string;
  duration_minutes: number;
  tags?: string[];
  logged_at?: string;
  status?: DraftLogStatus;
  is_client_visible?: boolean;
  milestone_id?: string | null;
}

export type UpdateDraftLogInput = Partial<CreateDraftLogInput>;

export interface DraftLogFilters {
  clientId?: string;
}
