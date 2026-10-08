// Keep chart axes and legends readable when the Vuetify mode changes.
export function chartTheme(options: any, colors: Record<string, unknown>) {
  const color = String(colors['on-surface'])
  const grid = color.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') + '26'
  const scales = Object.fromEntries(
    ['x', 'y'].map(axis => {
      const scale = options.scales?.[axis] ?? {}
      return [axis, {
        ...scale,
        ticks: { ...scale.ticks, color },
        grid: { ...scale.grid, color: grid },
      }]
    }),
  )
  return {
    ...options,
    color,
    scales,
    plugins: {
      ...options.plugins,
      legend: {
        ...options.plugins?.legend,
        labels: { ...options.plugins?.legend?.labels, color },
      },
    },
  }
}
