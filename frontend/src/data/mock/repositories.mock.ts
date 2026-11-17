import { addDays } from 'date-fns';
import type { Client } from '../../types/client';
import type { DraftLog } from '../../types/draft-log';
import type { Milestone } from '../../types/milestone';
import type { Report } from '../../types/report';
import { amountFor } from '../../domain/money';
import { logsForMilestone } from '../../domain/milestone-stats';
import { sumMinutes, minutesToHours } from '../../domain/duration';
import {
  clientSchema,
  createDraftLogSchema,
  milestoneSchema,
  updateDraftLogSchema,
} from '../../domain/schemas';
import type {
  ClientRepository,
  DraftLogRepository,
  MilestoneRepository,
  ReportRepository,
  Repositories,
  UserRepository,
} from '../repositories';
import { RepositoryError } from '../repositories';
import { db, delay, matches, newId, notFound, validate } from './db';
import { mockComposer } from './composer.mock';

const clients: ClientRepository = {
  async list() {
    await delay();
    return db.read((s) => s.clients);
  },

  async get(id) {
    await delay();
    return db.read((s) => s.clients.find((c) => c.id === id)) ?? notFound('Cliente', id);
  },

  async create(input) {
    await delay();
    const data = validate(clientSchema, input);
    return db.write((s) => {
      const client: Client = {
        id: newId('cli'),
        user_id: s.user.id,
        name: data.name,
        hourly_rate: data.hourly_rate,
        code: data.code || null,
        default_channel: data.default_channel || null,
        billing_cycle: data.billing_cycle || null,
        created_at: new Date().toISOString(),
      };
      s.clients.push(client);
      return client;
    });
  },

  async update(id, input) {
    await delay();
    const data = validate(clientSchema.partial(), input);
    return db.write((s) => {
      const client = s.clients.find((c) => c.id === id) ?? notFound('Cliente', id);
      Object.assign(client, data);
      return client;
    });
  },

  async remove(id) {
    await delay();
    db.write((s) => {
      if (!s.clients.some((c) => c.id === id)) notFound('Cliente', id);
      if (s.reports.some((r) => r.client_id === id)) {
        throw new RepositoryError('No se puede eliminar un cliente con reportes emitidos', 409);
      }
      // Mirrors ON DELETE CASCADE for draft_logs and milestones.
      s.clients = s.clients.filter((c) => c.id !== id);
      s.draftLogs = s.draftLogs.filter((l) => l.client_id !== id);
      s.milestones = s.milestones.filter((m) => m.client_id !== id);
    });
  },
};

const draftLogs: DraftLogRepository = {
  async list(filters = {}) {
    await delay();
    return db
      .read((s) => s.draftLogs)
      .filter(
        (log) =>
          matches(log.client_id, filters.clientId) &&
          matches(log.status, filters.status) &&
          matches(log.milestone_id ?? undefined, filters.milestoneId) &&
          (!filters.from || log.logged_at >= filters.from) &&
          (!filters.to || log.logged_at <= filters.to),
      )
      .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  },

  async get(id) {
    await delay();
    return db.read((s) => s.draftLogs.find((l) => l.id === id)) ?? notFound('Registro borrador', id);
  },

  async create(input) {
    await delay();
    const data = validate(createDraftLogSchema, input);
    return db.write((s) => {
      if (!s.clients.some((c) => c.id === data.client_id)) notFound('Cliente', data.client_id);
      const now = new Date().toISOString();
      const log: DraftLog = { id: newId('log'), ...data, logged_at: data.logged_at ?? now, created_at: now };
      s.draftLogs.push(log);
      return log;
    });
  },

  async update(id, input) {
    const [updated] = await draftLogs.updateMany([id], input);
    return updated ?? notFound('Registro borrador', id);
  },

  async updateMany(ids, input) {
    await delay();
    const data = validate(updateDraftLogSchema, input);
    // `partial()` keeps defaults; only apply keys the caller actually sent.
    const patch = Object.fromEntries(Object.keys(input).map((k) => [k, data[k as keyof typeof data]]));
    return db.write((s) => {
      const targets = ids.map((id) => s.draftLogs.find((l) => l.id === id) ?? notFound('Registro borrador', id));
      if (data.milestone_id) {
        const milestone = s.milestones.find((m) => m.id === data.milestone_id) ?? notFound('Hito', data.milestone_id);
        if (targets.some((l) => l.client_id !== milestone.client_id)) {
          throw new RepositoryError('Solo podés asignar registros del mismo cliente del hito', 400);
        }
      }
      for (const log of targets) Object.assign(log, patch);
      return targets;
    });
  },

  async remove(id) {
    await delay();
    db.write((s) => {
      if (!s.draftLogs.some((l) => l.id === id)) notFound('Registro borrador', id);
      s.draftLogs = s.draftLogs.filter((l) => l.id !== id);
    });
  },
};

/** consolidated_hours is always recomputed from logs so it can't drift. */
function withHours(milestone: Milestone, logs: DraftLog[]): Milestone {
  return { ...milestone, consolidated_hours: minutesToHours(sumMinutes(logsForMilestone(milestone.id, logs))) };
}

const milestones: MilestoneRepository = {
  async list(filters = {}) {
    await delay();
    return db.read((s) =>
      s.milestones
        .filter(
          (m) =>
            matches(m.client_id, filters.clientId) &&
            matches(m.status, filters.status) &&
            matches(m.report_id ?? undefined, filters.reportId),
        )
        .map((m) => withHours(m, s.draftLogs)),
    );
  },

  async get(id) {
    await delay();
    return db.read((s) => {
      const m = s.milestones.find((x) => x.id === id) ?? notFound('Hito', id);
      return withHours(m, s.draftLogs);
    });
  },

  async create(input) {
    await delay();
    const data = validate(milestoneSchema, input);
    return db.write((s) => {
      if (!s.clients.some((c) => c.id === data.client_id)) notFound('Cliente', data.client_id);
      const count = s.milestones.filter((m) => m.client_id === data.client_id).length;
      const milestone: Milestone = {
        id: newId('ms'),
        client_id: data.client_id,
        report_id: null,
        code: `HITO ${String(count + 1).padStart(2, '0')}`,
        category: data.category || null,
        title: data.title,
        description: null,
        impact_bullets: [],
        consolidated_hours: 0,
        estimated_hours: data.estimated_hours ?? null,
        status: data.status ?? 'active',
        created_at: new Date().toISOString(),
      };
      s.milestones.push(milestone);
      return milestone;
    });
  },

  async update(id, input) {
    await delay();
    return db.write((s) => {
      const m = s.milestones.find((x) => x.id === id) ?? notFound('Hito', id);
      if (input.title !== undefined && !input.title.trim()) {
        throw new RepositoryError('El campo "título" es obligatorio', 400);
      }
      Object.assign(m, input);
      return withHours(m, s.draftLogs);
    });
  },

  async remove(id) {
    await delay();
    db.write((s) => {
      if (!s.milestones.some((m) => m.id === id)) notFound('Hito', id);
      s.milestones = s.milestones.filter((m) => m.id !== id);
      for (const log of s.draftLogs) {
        if (log.milestone_id === id) {
          log.milestone_id = null;
          if (log.status === 'grouped') log.status = 'pending';
        }
      }
    });
  },
};

const reports: ReportRepository = {
  async list(filters = {}) {
    await delay();
    return db
      .read((s) => s.reports)
      .filter((r) => matches(r.client_id, filters.clientId) && matches(r.status, filters.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async get(id) {
    await delay();
    return db.read((s) => s.reports.find((r) => r.id === id)) ?? notFound('Reporte', id);
  },

  async create(input) {
    await delay();
    if (input.milestone_ids.length === 0) {
      throw new RepositoryError('El reporte necesita al menos un hito conciliado', 400);
    }
    return db.write((s) => {
      const client = s.clients.find((c) => c.id === input.client_id) ?? notFound('Cliente', input.client_id);
      const linked = input.milestone_ids.map((id) => s.milestones.find((m) => m.id === id) ?? notFound('Hito', id));
      const minutes = linked.reduce((t, m) => t + sumMinutes(logsForMilestone(m.id, s.draftLogs)), 0);
      s.counters.report += 1;
      const report: Report = {
        id: newId('rpt'),
        client_id: client.id,
        report_code: `RPT-${new Date().getFullYear()}-${String(s.counters.report).padStart(3, '0')}`,
        period_start: input.period_start,
        period_end: input.period_end,
        executive_tone: input.executive_tone,
        total_billable_hours: minutesToHours(minutes),
        hourly_rate_snapshot: client.hourly_rate,
        total_amount: amountFor(minutes, client.hourly_rate),
        markdown_preview: null,
        public_token: null,
        is_public_enabled: false,
        expires_at: null,
        status: 'approved',
        created_at: new Date().toISOString(),
      };
      s.reports.push(report);
      for (const m of linked) {
        m.report_id = report.id;
        m.status = 'completed';
      }
      return report;
    });
  },

  async update(id, input) {
    await delay();
    return db.write((s) => {
      const report = s.reports.find((r) => r.id === id) ?? notFound('Reporte', id);
      Object.assign(report, input);
      return report;
    });
  },

  async enablePublicLink(id, days) {
    await delay();
    return db.write((s) => {
      const report = s.reports.find((r) => r.id === id) ?? notFound('Reporte', id);
      report.public_token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      report.is_public_enabled = true;
      report.expires_at = addDays(new Date(), days).toISOString();
      return report;
    });
  },

  async remove(id) {
    await delay();
    db.write((s) => {
      const report = s.reports.find((r) => r.id === id) ?? notFound('Reporte', id);
      if (report.status === 'dispatched') {
        throw new RepositoryError('No se puede eliminar un reporte ya despachado', 409);
      }
      s.reports = s.reports.filter((r) => r.id !== id);
      for (const m of s.milestones) {
        if (m.report_id === id) {
          m.report_id = null;
          m.status = 'in_review';
        }
      }
    });
  },
};

const users: UserRepository = {
  async getMe() {
    await delay();
    return db.read((s) => s.user);
  },

  async updateMe(input) {
    await delay();
    if (input.name !== undefined && !input.name.trim()) {
      throw new RepositoryError('El campo "nombre" es obligatorio', 400);
    }
    return db.write((s) => Object.assign(s.user, input));
  },
};

export const mockRepositories: Repositories = {
  clients,
  draftLogs,
  milestones,
  reports,
  users,
  composer: mockComposer,
  async resetDemoData() {
    await delay();
    db.reset();
  },
};

