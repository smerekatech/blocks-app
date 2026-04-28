import { apiFetch } from './client';
import type { Activity } from './types';

export function listActivities(opts?: { includeArchived?: boolean }): Promise<Activity[]> {
  return apiFetch<Activity[]>('/api/activities', {
    query: opts?.includeArchived ? { includeArchived: '1' } : undefined,
  });
}
