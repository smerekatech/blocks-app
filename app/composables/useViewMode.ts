export type ViewMode = 'day' | 'workweek' | 'week' | 'month'

const VIEW_MODES: ViewMode[] = ['day', 'workweek', 'week', 'month']

export function useViewMode() {
  return useCookie<ViewMode>('blocks-view-mode', {
    default: () => 'workweek',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    decode: v => VIEW_MODES.includes(v as ViewMode) ? (v as ViewMode) : 'workweek',
    encode: v => v
  })
}
