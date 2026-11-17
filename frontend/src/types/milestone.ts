/** Mirrors `milestones` in backend/src/docs/modelo-datos.md (not yet in the API). */
export const MILESTONE_STATUSES = ['active', 'in_review', 'completed'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone {
  id: string;
  client_id: string;
  report_id: string | null;
  code: string | null;
  category: string | null;
  title: string;
  description: string | null;
  impact_bullets: string[];
  /** Stored by the backend, but the UI derives it from grouped logs (see domain/milestone-stats). */
  consolidated_hours: number;
  estimated_hours: number | null;
  status: MilestoneStatus;
  created_at: string;
}

export interface CreateMilestoneInput {
  client_id: string;
  title: string;
  category?: string | null;
  estimated_hours?: number | null;
}

export type UpdateMilestoneInput = Partial<
  Pick<
    Milestone,
    'title' | 'category' | 'description' | 'impact_bullets' | 'estimated_hours' | 'status' | 'report_id'
  >
>;
