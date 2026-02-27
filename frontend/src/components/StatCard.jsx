import { formatARS } from '../utils'

export default function StatCard({ label, amount, sub, color = 'text-white', icon }) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{formatARS(amount)}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}
