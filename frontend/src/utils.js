import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

/** Format number as ARS currency: $1.234.567 */
export const formatARS = (amount) => {
  if (amount == null) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format date as DD/MM/YYYY */
export const formatDate = (d) => {
  if (!d) return ''
  return dayjs(d).format('DD/MM/YYYY')
}

/** Format month as "Febrero 2026" */
export const formatMonth = (yyyyMM) => {
  if (!yyyyMM) return ''
  return dayjs(`${yyyyMM}-01`).format('MMMM YYYY').replace(/^./, (c) => c.toUpperCase())
}

/** Return YYYY-MM for today */
export const currentMonth = () => dayjs().format('YYYY-MM')

/** Return YYYY-MM-DD for today */
export const today = () => dayjs().format('YYYY-MM-DD')

/** Add/subtract months from a YYYY-MM string */
export const addMonth = (yyyyMM, delta) =>
  dayjs(`${yyyyMM}-01`).add(delta, 'month').format('YYYY-MM')

/** Short month label for charts: "Feb" */
export const shortMonth = (yyyyMM) =>
  dayjs(`${yyyyMM}-01`).format('MMM').replace('.', '')

/** Color for gasto vs presupuesto percentage */
export const budgetColor = (pct) => {
  if (pct == null) return 'text-slate-400'
  if (pct <= 85) return 'text-emerald-400'
  if (pct <= 100) return 'text-amber-400'
  return 'text-red-400'
}

/** Progress bar color */
export const progressColor = (pct) => {
  if (pct == null) return 'bg-slate-500'
  if (pct <= 85) return 'bg-emerald-500'
  if (pct <= 100) return 'bg-amber-500'
  return 'bg-red-500'
}

/** Source label */
export const sourceLabel = {
  manual: 'Manual',
  telegram_bot: 'Bot',
  recurrente: 'Recurrente',
}

/** Source badge color */
export const sourceColor = {
  manual: 'bg-slate-600 text-slate-300',
  telegram_bot: 'bg-blue-500/20 text-blue-400',
  recurrente: 'bg-purple-500/20 text-purple-400',
}

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444',
  '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#a855f7', '#d946ef', '#fb923c', '#4ade80', '#34d399',
]
