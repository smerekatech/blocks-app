import { apiFetch } from './client';
import type { Entry } from './types';

export function listEntries(range: { from: string; to: string }): Promise<Entry[]> {
  return apiFetch<Entry[]>('/api/entries', { query: range });
}

export interface PatchEntryInput {
  blocks?: 0.5 | 1;
  position?: number;
  activityId?: number;
  name?: string;
}

export function patchEntry(id: number, input: PatchEntryInput): Promise<Entry> {
  return apiFetch<Entry>(`/api/entries/${id}`, { method: 'PATCH', body: input });
}

export function deleteEntry(id: number): Promise<{ id: number; deleted: true }> {
  return apiFetch<{ id: number; deleted: true }>(`/api/entries/${id}`, { method: 'DELETE' });
}
