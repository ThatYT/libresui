export type ThemeMode = 'light' | 'dark'
export const themeModes: ThemeMode[] = ['light', 'dark']

export function savedTheme(): ThemeMode {
  const saved = localStorage.getItem('theme')
  const legacySkin = localStorage.getItem('skin')
  // Preserve the base mode of the former gradient presets on first use.
  const mode = saved === 'light' || saved === 'dark'
    ? saved
    : ['aurora', 'deepsea', 'cyber', 'dark'].includes(legacySkin ?? saved ?? '')
      ? 'dark' : 'light'
  localStorage.setItem('theme', mode)
  localStorage.removeItem('skin')
  document.documentElement.removeAttribute('data-skin')
  return mode
}
