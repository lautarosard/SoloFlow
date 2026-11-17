import { beforeEach, describe, expect, it } from 'vitest';
import { mockRepositories as repos } from './repositories.mock';
import { composeFromLogs } from './composer.mock';
import { RepositoryError } from '../repositories';

beforeEach(async () => {
  await repos.resetDemoData?.();
});

describe('mock draft logs', () => {
  it('creates a pending log with defaults', async () => {
    const log = await repos.draftLogs.create({
      client_id: 'cli-fintech-01',
      description: '  Fix de login  ',
      duration_minutes: 30,
    });
    expect(log).toMatchObject({ status: 'pending', description: 'Fix de login', tags: [], milestone_id: null });
    const pending = await repos.draftLogs.list({ status: 'pending', clientId: 'cli-fintech-01' });
    expect(pending.some((l) => l.id === log.id)).toBe(true);
  });

  it('rejects invalid input like the backend (400)', async () => {
    await expect(
      repos.draftLogs.create({ client_id: 'cli-fintech-01', description: 'x', duration_minutes: 0 }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      repos.draftLogs.create({ client_id: 'nope', description: 'x', duration_minutes: 15 }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('bulk-assigns logs to a milestone and updates its hours', async () => {
    const before = await repos.milestones.get('ms-auth-pay');
    const pending = await repos.draftLogs.list({ status: 'pending', clientId: 'cli-fintech-01' });
    const ids = pending.slice(0, 2).map((l) => l.id);
    const added = pending.slice(0, 2).reduce((t, l) => t + l.duration_minutes, 0);

    await repos.draftLogs.updateMany(ids, { status: 'grouped', milestone_id: 'ms-auth-pay' });

    const after = await repos.milestones.get('ms-auth-pay');
    expect(after.consolidated_hours).toBeCloseTo(before.consolidated_hours + added / 60, 2);
  });

  it('refuses to assign logs to another client’s milestone', async () => {
    const [hpLog] = await repos.draftLogs.list({ status: 'pending', clientId: 'cli-health-02' });
    await expect(
      repos.draftLogs.updateMany([hpLog!.id], { status: 'grouped', milestone_id: 'ms-auth-pay' }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});

describe('mock milestones', () => {
  it('returns logs to pending when deleted', async () => {
    await repos.milestones.remove('ms-sql-cache');
    const logs = await repos.draftLogs.list({ clientId: 'cli-metric-03' });
    expect(logs.every((l) => l.milestone_id === null)).toBe(true);
    expect(logs.some((l) => l.status === 'grouped')).toBe(false);
  });
});

describe('mock reports', () => {
  it('freezes the rate, totals hours and completes milestones', async () => {
    const report = await repos.reports.create({
      client_id: 'cli-metric-03',
      period_start: '2025-03-10',
      period_end: '2025-03-16',
      executive_tone: 'roi_business',
      milestone_ids: ['ms-sql-cache'],
    });
    // Seed: 120 + 135 + 60 = 315 min = 5.25h at $95/h
    expect(report.total_billable_hours).toBe(5.25);
    expect(report.hourly_rate_snapshot).toBe(95);
    expect(report.total_amount).toBe(498.75);
    expect(report.report_code).toMatch(/^RPT-\d{4}-002$/);

    const milestone = await repos.milestones.get('ms-sql-cache');
    expect(milestone).toMatchObject({ status: 'completed', report_id: report.id });
  });

  it('requires at least one milestone', async () => {
    await expect(
      repos.reports.create({
        client_id: 'cli-metric-03',
        period_start: '2025-03-10',
        period_end: '2025-03-16',
        executive_tone: 'bullets',
        milestone_ids: [],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('mock composer', () => {
  it('builds a narrative from logs per tone', async () => {
    const client = await repos.clients.get('cli-fintech-01');
    const milestone = await repos.milestones.get('ms-auth-pay');
    const logs = await repos.draftLogs.list({ milestoneId: 'ms-auth-pay' });

    const roi = composeFromLogs({ client, milestone, logs, tone: 'roi_business' });
    expect(roi.description).toContain(milestone.title);
    expect(roi.impact_bullets.length).toBe(logs.length);

    const bullets = composeFromLogs({ client, milestone, logs, tone: 'bullets' });
    expect(bullets.impact_bullets[0]).not.toMatch(/\.$/);
  });
});
