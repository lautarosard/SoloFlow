import type { DraftLog } from '../types/draft-log';
import type { Milestone } from '../types/milestone';
import { minutesToHours, sumMinutes } from './duration';

/** Logs grouped into a milestone (discarded logs never count). */
export function logsForMilestone(milestoneId: string, logs: readonly DraftLog[]): DraftLog[] {
  return logs.filter((log) => log.milestone_id === milestoneId && log.status === 'grouped');
}

export interface MilestoneProgress {
  consolidatedMinutes: number;
  consolidatedHours: number;
  estimatedHours: number | null;
  /** 0..1, or null when there is no estimate. Can exceed 1 when over budget. */
  ratio: number | null;
  overBudget: boolean;
  taskCount: number;
}

export function milestoneProgress(milestone: Milestone, logs: readonly DraftLog[]): MilestoneProgress {
  const linked = logsForMilestone(milestone.id, logs);
  const consolidatedMinutes = sumMinutes(linked);
  const consolidatedHours = minutesToHours(consolidatedMinutes);
  const estimated = milestone.estimated_hours;
  const ratio = estimated && estimated > 0 ? consolidatedHours / estimated : null;
  return {
    consolidatedMinutes,
    consolidatedHours,
    estimatedHours: estimated,
    ratio,
    overBudget: ratio !== null && ratio > 1,
    taskCount: linked.length,
  };
}
