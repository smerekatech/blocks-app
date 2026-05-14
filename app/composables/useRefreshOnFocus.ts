export function useRefreshOnFocus(refresh: () => unknown) {
  if (typeof window === 'undefined') return
  const onFocus = () => { void refresh() }
  const onVisible = () => {
    if (document.visibilityState === 'visible') void refresh()
  }
  onMounted(() => {
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
  })
  onUnmounted(() => {
    window.removeEventListener('focus', onFocus)
    document.removeEventListener('visibilitychange', onVisible)
  })
}
