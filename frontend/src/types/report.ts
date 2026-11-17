/** Mirrors `reports` in backend/src/docs/modelo-datos.md (not yet in the API). */
export const EXECUTIVE_TONES = ['roi_business', 'tech_exec', 'bullets'] as const;
export type ExecutiveTone = (typeof EXECUTIVE_TONES)[number];

export const REPORT_STATUSES = ['draft', 'approved', 'dispatched'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Report {
  id: string;
  client_id: string;
  report_code: string;
  /** ISO date (YYYY-MM-DD) */
  period_start: string;
  /** ISO date (YYYY-MM-DD) */
  period_end: string;
  executive_tone: ExecutiveTone;
  total_billable_hours: number;
  /** Client rate frozen when the report is created. */
  hourly_rate_snapshot: number;
  total_amount: number;
  markdown_preview: string | null;
  public_token: string | null;
  is_public_enabled: boolean;
  expires_at: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface CreateReportInput {
  client_id: string;
  period_start: string;
  period_end: string;
  executive_tone: ExecutiveTone;
  milestone_ids: string[];
}

export type UpdateReportInput = Partial<
  Pick<Report, 'executive_tone' | 'markdown_preview' | 'is_public_enabled' | 'expires_at' | 'status'>
>;
