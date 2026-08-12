export function applyTheme(theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (!theme || theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', systemDark)
  } else if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  }
}
