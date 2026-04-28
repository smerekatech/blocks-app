import { apiFetch } from './client';

export interface StatsByDay {
  date: string;
  blocks: number;
}

export interface StatsByActivity {
  activityId: number | null;
  name: string;
  color: string;
  blocks: number;
}

export interface StatsResponse {
  from: string;
  to: string;
  total: number;
  byDay: StatsByDay[];
  byActivity: StatsByActivity[];
}

export function getStats(range: { from: string; to: string }): Promise<StatsResponse> {
  return apiFetch<StatsResponse>('/api/stats', { query: range });
}
