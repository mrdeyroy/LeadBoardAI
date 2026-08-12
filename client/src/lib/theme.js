const THEME_STORAGE_KEY = 'leadboard_theme'

export function getSavedTheme() {
  if (typeof window === 'undefined') return 'system'
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme) {
  if (typeof window === 'undefined') return
  const activeTheme = theme || getSavedTheme()
  try {
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme)
  } catch {
    // Ignore storage restrictions if disabled
  }

  const root = document.documentElement

  if (activeTheme === 'dark') {
    root.classList.add('dark')
  } else if (activeTheme === 'light') {
    root.classList.remove('dark')
  } else {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', isSystemDark)
  }
}

export function initTheme() {
  if (typeof window === 'undefined') return
  applyTheme(getSavedTheme())

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemChange = (e) => {
    if (getSavedTheme() === 'system') {
      document.documentElement.classList.toggle('dark', e.matches)
    }
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.removeEventListener('change', handleSystemChange)
    mediaQuery.addEventListener('change', handleSystemChange)
  }
}

// Auto initialize on module import
initTheme()

