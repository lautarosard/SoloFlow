import type { ComposeInput, ComposeResult, ComposerRepository } from '../repositories';
import { formatHours, sumMinutes } from '../../domain/duration';

/**
 * Template-based stand-in for the AI narrative. Deterministic, so it is easy to test,
 * and slower than other mocks so the "generating" state is visible.
 */
export const mockComposer: ComposerRepository = {
  async generate(input) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return composeFromLogs(input);
  },
};

const AREA_BY_TAG: Record<string, string> = {
  '#Backend': 'la capa de servicios',
  '#Frontend': 'la experiencia de usuario',
  '#Database': 'la base de datos',
  '#Performance': 'el rendimiento de la plataforma',
  '#Auth': 'la autenticación',
  '#Seguridad': 'la seguridad',
  '#Pagos': 'el flujo de pagos',
  '#DevOps': 'el pipeline de despliegue',
  '#Infra': 'la infraestructura',
  '#QA': 'la calidad del producto',
  '#Fix Crítico': 'la estabilidad en producción',
};

export function composeFromLogs({ milestone, logs, tone }: ComposeInput): ComposeResult {
  const hours = formatHours(sumMinutes(logs));
  const areas = unique(logs.flatMap((l) => l.tags).map((t) => AREA_BY_TAG[t]).filter(isString)).slice(0, 3);
  const areaText = areas.length > 0 ? joinEs(areas) : 'el producto';
  const items = logs.map((l) => sentence(l.description));

  switch (tone) {
    case 'roi_business':
      return {
        description: `Se consolidó el entregable "${milestone.title}" (${hours}), fortaleciendo ${areaText} y reduciendo el riesgo operativo para el negocio.`,
        impact_bullets: items.slice(0, 4).map((item) => `${item}, con impacto directo en la continuidad del servicio.`),
      };
    case 'tech_exec':
      return {
        description: `Trabajo técnico sobre ${areaText} en el marco de "${milestone.title}" (${hours} invertidas).`,
        impact_bullets: items.slice(0, 4).map((item) => `${item}.`),
      };
    case 'bullets':
      return {
        description: `${milestone.title} — ${hours}.`,
        impact_bullets: items.slice(0, 5),
      };
  }
}

function sentence(text: string): string {
  const trimmed = text.trim().replace(/[.\s]+$/, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function isString(value: string | undefined): value is string {
  return typeof value === 'string';
}

function joinEs(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}
