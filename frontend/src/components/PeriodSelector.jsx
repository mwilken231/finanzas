import { formatMonth, addMonth } from '../utils'

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addMonth(value, -1))}
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200"
        aria-label="Mes anterior"
      >
        ‹
      </button>
      <span className="text-base font-semibold text-white min-w-36 text-center">
        {formatMonth(value)}
      </span>
      <button
        onClick={() => onChange(addMonth(value, 1))}
        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200"
        aria-label="Mes siguiente"
      >
        ›
      </button>
    </div>
  )
}
