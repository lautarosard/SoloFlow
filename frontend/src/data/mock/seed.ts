import { addDays, setHours, setMinutes, startOfDay, subDays } from 'date-fns';
import type { Client } from '../../types/client';
import type { DraftLog } from '../../types/draft-log';
import type { Milestone } from '../../types/milestone';
import type { Report } from '../../types/report';
import type { User } from '../../types/user';
import { getWeekPeriod, toIsoDate } from '../../domain/week';

export interface MockState {
  user: User;
  clients: Client[];
  draftLogs: DraftLog[];
  milestones: Milestone[];
  reports: Report[];
  counters: { report: number };
}

export const DEMO_USER_ID = 'user-martin-123';

/** Demo data relative to `now`, so the app always shows "this week". */
export function createSeed(now: Date = new Date()): MockState {
  const at = (daysAgo: number, hour: number, minute = 0) =>
    setMinutes(setHours(startOfDay(subDays(now, daysAgo)), hour), minute).toISOString();

  const lastWeek = getWeekPeriod(subDays(now, 7));
  const created = subDays(now, 60).toISOString();

  const clients: Client[] = [
    {
      id: 'cli-fintech-01',
      user_id: DEMO_USER_ID,
      name: 'Fintech Nova Inc.',
      code: 'FN',
      default_channel: 'Slack #eng-core',
      hourly_rate: 85,
      billing_cycle: 'Facturación quincenal',
      created_at: created,
    },
    {
      id: 'cli-health-02',
      user_id: DEMO_USER_ID,
      name: 'HealthPulse',
      code: 'HP',
      default_channel: 'Discord #api-dev',
      hourly_rate: 90,
      billing_cycle: 'Facturación quincenal',
      created_at: created,
    },
    {
      id: 'cli-metric-03',
      user_id: DEMO_USER_ID,
      name: 'MetricFlow',
      code: 'MF',
      default_channel: 'Slack #data-platform',
      hourly_rate: 95,
      billing_cycle: 'Facturación mensual',
      created_at: created,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: 'ms-auth-pay',
      client_id: 'cli-fintech-01',
      report_id: null,
      code: 'HITO 01',
      category: 'Seguridad & Pagos',
      title: 'Arquitectura de Autenticación & Pagos',
      description: null,
      impact_bullets: [],
      consolidated_hours: 0,
      estimated_hours: 12,
      status: 'active',
      created_at: at(6, 9),
    },
    {
      id: 'ms-sql-cache',
      client_id: 'cli-metric-03',
      report_id: null,
      code: 'HITO 01',
      category: 'Performance',
      title: 'Optimización de Consultas SQL y Cache',
      description: null,
      impact_bullets: [],
      consolidated_hours: 0,
      estimated_hours: 6,
      status: 'in_review',
      created_at: at(5, 9),
    },
    {
      id: 'ms-checkout',
      client_id: 'cli-fintech-01',
      report_id: 'rpt-0001',
      code: 'HITO 01',
      category: 'Latencia & Resiliencia',
      title: 'Optimización de Latencia y Checkout',
      description:
        'Reingeniería del flujo de transacciones y refactorización de queries concurrentes de alto volumen.',
      impact_bullets: [
        'Reducción del tiempo P95 de 420ms a 110ms en la pasarela de pagos.',
        'Mitigación de bloqueos (deadlocks) en PostgreSQL bajo tráfico pico.',
      ],
      consolidated_hours: 0,
      estimated_hours: 10,
      status: 'completed',
      created_at: lastWeek.start.toISOString(),
    },
  ];

  let n = 4100;
  const log = (
    client_id: string,
    description: string,
    duration_minutes: number,
    tags: string[],
    logged_at: string,
    status: DraftLog['status'] = 'pending',
    milestone_id: string | null = null,
  ): DraftLog => ({
    id: `log-${n++}`,
    client_id,
    milestone_id,
    description,
    duration_minutes,
    tags,
    logged_at,
    status,
    is_client_visible: false,
    created_at: logged_at,
  });

  const lw = (dayOffset: number, hour: number) =>
    setHours(addDays(lastWeek.start, dayOffset), hour).toISOString();

  const draftLogs: DraftLog[] = [
    // Last week — already reported (Fintech Nova, checkout milestone)
    log('cli-fintech-01', 'Refactor de queries concurrentes en checkout', 240, ['#Backend', '#Performance'], lw(0, 10), 'grouped', 'ms-checkout'),
    log('cli-fintech-01', 'Profiling P95 de pasarela y fix de índices', 180, ['#Backend', '#Database'], lw(1, 11), 'grouped', 'ms-checkout'),
    log('cli-fintech-01', 'Fix de deadlocks en tabla de transacciones', 180, ['#Database', '#Fix Crítico'], lw(2, 15), 'grouped', 'ms-checkout'),
    log('cli-fintech-01', 'Tests de carga con k6 sobre checkout', 120, ['#QA'], lw(3, 9), 'grouped', 'ms-checkout'),

    // This week — grouped into active milestones
    log('cli-fintech-01', 'Fix en middleware de autenticación JWT', 105, ['#Backend', '#Auth'], at(4, 10), 'grouped', 'ms-auth-pay'),
    log('cli-fintech-01', 'Integración de webhooks de Stripe', 150, ['#Backend', '#Pagos'], at(3, 14), 'grouped', 'ms-auth-pay'),
    log('cli-fintech-01', 'Rotación de refresh tokens y revocación', 90, ['#Auth', '#Seguridad'], at(2, 11), 'grouped', 'ms-auth-pay'),
    log('cli-metric-03', 'Índices compuestos en Postgres para dashboard', 120, ['#Database', '#Performance'], at(4, 16), 'grouped', 'ms-sql-cache'),
    log('cli-metric-03', 'Capa de cache con Redis para agregaciones', 135, ['#Backend', '#Infra'], at(3, 10), 'grouped', 'ms-sql-cache'),
    log('cli-metric-03', 'Revisión de EXPLAIN ANALYZE con el equipo de datos', 60, ['#Reunión', '#Database'], at(2, 17), 'grouped', 'ms-sql-cache'),

    // This week — pending triage
    log('cli-fintech-01', 'Fix de memory leak en worker de WebSockets', 90, ['#Backend', '#Fix Crítico'], at(1, 10)),
    log('cli-fintech-01', 'Reunión rápida sync de spec con TL', 30, ['#Reunión'], at(1, 15)),
    log('cli-metric-03', 'Setup de pipeline CI/CD en GitHub Actions y Docker', 120, ['#DevOps', '#Infra'], at(2, 9)),
    log('cli-health-02', 'Micro-fix de estilos en CSS y tipografía mobile', 15, ['#Frontend'], at(3, 12)),
    log('cli-health-02', 'Optimización de pipeline de métricas de telemetría', 75, ['#Backend', '#Telemetría'], at(0, 9)),
    log('cli-health-02', 'Daily y revisión inicial de PR de onboarding', 45, ['#Reunión', '#Code Review'], at(0, 11)),
    log('cli-fintech-01', 'Investigación de timeout intermitente en API de cotizaciones', 60, ['#Backend', '#Debug'], at(0, 14)),

    // Discarded
    log('cli-health-02', 'Pruebas de librería de gráficos (descartada)', 30, ['#Frontend'], at(3, 17), 'discarded'),
  ];

  const reports: Report[] = [
    {
      id: 'rpt-0001',
      client_id: 'cli-fintech-01',
      report_code: `RPT-${now.getFullYear()}-001`,
      period_start: toIsoDate(lastWeek.start),
      period_end: toIsoDate(lastWeek.end),
      executive_tone: 'roi_business',
      total_billable_hours: 12,
      hourly_rate_snapshot: 85,
      total_amount: 1020,
      markdown_preview: null,
      public_token: 'fnv-demo-001',
      is_public_enabled: true,
      expires_at: addDays(lastWeek.end, 7).toISOString(),
      status: 'dispatched',
      created_at: lastWeek.end.toISOString(),
    },
  ];

  return {
    user: {
      id: DEMO_USER_ID,
      name: 'Martín S.',
      role_title: 'Sr. Engineer',
      email: 'martin@example.com',
      created_at: created,
    },
    clients,
    draftLogs,
    milestones,
    reports,
    counters: { report: 1 },
  };
}
