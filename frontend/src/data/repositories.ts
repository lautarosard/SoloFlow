import type { Client, CreateClientInput, UpdateClientInput } from '../types/client';
import type {
  CreateDraftLogInput,
  DraftLog,
  DraftLogStatus,
  UpdateDraftLogInput,
} from '../types/draft-log';
import type { CreateMilestoneInput, Milestone, MilestoneStatus, UpdateMilestoneInput } from '../types/milestone';
import type { CreateReportInput, ExecutiveTone, Report, ReportStatus, UpdateReportInput } from '../types/report';
import type { UpdateUserInput, User } from '../types/user';

/**
 * Data-access contracts. The UI only talks to these (through hooks/), never to HTTP or mocks directly.
 * Implementations: data/mock (in-browser demo) and data/http (REST backend). Add e.g. data/supabase later.
 * All methods reject with RepositoryError on failure.
 */

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly status: number = 500,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export interface ClientRepository {
  list(): Promise<Client[]>;
  get(id: string): Promise<Client>;
  create(input: CreateClientInput): Promise<Client>;
  update(id: string, input: UpdateClientInput): Promise<Client>;
  remove(id: string): Promise<void>;
}

export interface DraftLogFilters {
  clientId?: string;
  status?: DraftLogStatus | DraftLogStatus[];
  milestoneId?: string;
  /** Inclusive ISO datetime bounds on logged_at. */
  from?: string;
  to?: string;
}

export interface DraftLogRepository {
  list(filters?: DraftLogFilters): Promise<DraftLog[]>;
  get(id: string): Promise<DraftLog>;
  create(input: CreateDraftLogInput): Promise<DraftLog>;
  update(id: string, input: UpdateDraftLogInput): Promise<DraftLog>;
  /** Same patch applied to many logs (triage bulk actions). */
  updateMany(ids: string[], input: UpdateDraftLogInput): Promise<DraftLog[]>;
  remove(id: string): Promise<void>;
}

export interface MilestoneFilters {
  clientId?: string;
  status?: MilestoneStatus | MilestoneStatus[];
  reportId?: string;
}

export interface MilestoneRepository {
  list(filters?: MilestoneFilters): Promise<Milestone[]>;
  get(id: string): Promise<Milestone>;
  create(input: CreateMilestoneInput): Promise<Milestone>;
  update(id: string, input: UpdateMilestoneInput): Promise<Milestone>;
  /** Linked logs go back to `pending` (FK is ON DELETE SET NULL). */
  remove(id: string): Promise<void>;
}

export interface ReportFilters {
  clientId?: string;
  status?: ReportStatus | ReportStatus[];
}

export interface ReportRepository {
  list(filters?: ReportFilters): Promise<Report[]>;
  get(id: string): Promise<Report>;
  /** Freezes the client rate, links milestones and computes totals. */
  create(input: CreateReportInput): Promise<Report>;
  update(id: string, input: UpdateReportInput): Promise<Report>;
  /** Generates (or rotates) the public token, valid for `days`. */
  enablePublicLink(id: string, days: number): Promise<Report>;
  remove(id: string): Promise<void>;
}

export interface UserRepository {
  getMe(): Promise<User>;
  updateMe(input: UpdateUserInput): Promise<User>;
}

export interface ComposeInput {
  client: Client;
  milestone: Milestone;
  logs: DraftLog[];
  tone: ExecutiveTone;
}

export interface ComposeResult {
  description: string;
  impact_bullets: string[];
}

/** AI narrative generation. Real implementation must run server-side (API keys never reach the browser). */
export interface ComposerRepository {
  generate(input: ComposeInput): Promise<ComposeResult>;
}

export interface Repositories {
  clients: ClientRepository;
  draftLogs: DraftLogRepository;
  milestones: MilestoneRepository;
  reports: ReportRepository;
  users: UserRepository;
  composer: ComposerRepository;
  /** Only the mock source supports resetting demo data. */
  resetDemoData?: () => Promise<void>;
}
