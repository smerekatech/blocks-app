import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEntry, patchEntry, type PatchEntryInput } from '~/api/entries';
import type { Entry } from '~/api/types';

interface PatchVars {
  id: number;
  input: PatchEntryInput;
}

export function usePatchEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: PatchVars) => patchEntry(id, input),
    async onMutate({ id, input }) {
      // Optimistic: patch any cached entries lists.
      const all = qc.getQueriesData<Entry[]>({ queryKey: ['entries'] });
      const snapshot = all.map(([key, data]) => [key, data] as const);
      for (const [key, data] of all) {
        if (!data) continue;
        qc.setQueryData<Entry[]>(
          key,
          data.map((e) => {
            if (e.id !== id) return e;
            const next: Entry = { ...e };
            if (input.blocks != null) next.blocks = input.blocks;
            if (input.activityId != null) {
              next.activityId = input.activityId;
              next.name = null;
            }
            if (input.name != null) {
              next.name = input.name;
              next.activityId = null;
            }
            return next;
          }),
        );
      }
      return { snapshot };
    },
    onError(_err, _vars, ctx) {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled() {
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteEntry(id),
    async onMutate(id) {
      const all = qc.getQueriesData<Entry[]>({ queryKey: ['entries'] });
      const snapshot = all.map(([key, data]) => [key, data] as const);
      for (const [key, data] of all) {
        if (!data) continue;
        qc.setQueryData<Entry[]>(
          key,
          data.filter((e) => e.id !== id),
        );
      }
      return { snapshot };
    },
    onError(_err, _id, ctx) {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled() {
      void qc.invalidateQueries({ queryKey: ['entries'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
