import { useState, useEffect } from 'react'
import { getDashboardSummary, getPlans } from '../api'
import { formatARS, currentMonth, budgetColor } from '../utils'
import PeriodSelector from '../components/PeriodSelector'

export default function Consolidated() {
  const [mes, setMes] = useState(currentMonth)
  const [summary, setSummary] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDashboardSummary(mes),
      getPlans(mes),
    ]).then(([s, p]) => {
      setSummary(s)
      setPlans(p)
    }).finally(() => setLoading(false))
  }, [mes])

  const planGastos = plans.filter(p => p.tipo === 'gasto')
  const planIngresos = plans.filter(p => p.tipo === 'ingreso')

  const totalPlanGastos = planGastos.reduce((s, p) => s + p.monto_planificado, 0)
  const totalPlanIngresos = planIngresos.reduce((s, p) => s + p.monto_planificado, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Consolidado financiero</h2>
        <PeriodSelector value={mes} onChange={setMes} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary && (
        <>
          {/* Summary table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-3 pr-4">Concepto</th>
                  <th className="pb-3 pr-4 text-right">Planificado</th>
                  <th className="pb-3 pr-4 text-right">Real</th>
                  <th className="pb-3 text-right">Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                <tr>
                  <td className="py-3 pr-4 font-medium text-emerald-400">Ingresos proyectados</td>
                  <td className="py-3 pr-4 text-right">{formatARS(totalPlanIngresos)}</td>
                  <td className="py-3 pr-4 text-right text-emerald-400">{formatARS(summary.ingreso_total)}</td>
                  <td className={`py-3 text-right font-semibold ${budgetColor(totalPlanIngresos > 0 ? summary.ingreso_total / totalPlanIngresos * 100 : null)}`}>
                    {totalPlanIngresos > 0 ? `${(summary.ingreso_total / totalPlanIngresos * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-red-400">Presupuesto gastos</td>
                  <td className="py-3 pr-4 text-right">{formatARS(totalPlanGastos)}</td>
                  <td className="py-3 pr-4 text-right text-red-400">{formatARS(summary.gasto_total)}</td>
                  <td className={`py-3 text-right font-semibold ${budgetColor(totalPlanGastos > 0 ? summary.gasto_total / totalPlanGastos * 100 : null)}`}>
                    {totalPlanGastos > 0 ? `${(summary.gasto_total / totalPlanGastos * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-3 pr-4 text-white">Saldo proyectado</td>
                  <td className="py-3 pr-4 text-right">{formatARS(totalPlanIngresos - totalPlanGastos)}</td>
                  <td className={`py-3 pr-4 text-right ${summary.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatARS(summary.saldo)}
                  </td>
                  <td className="py-3 text-right text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* By category */}
          {summary.gastos_por_categoria.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Gastos por categoría</h3>
              <div className="space-y-2">
                {summary.gastos_por_categoria.map((cat) => {
                  const plan = planGastos.find(p => p.categoria_id === cat.categoria_id)
                  const pct = plan ? cat.monto / plan.monto_planificado * 100 : null
                  return (
                    <div key={cat.categoria_id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-300 truncate">{cat.categoria_nombre}</span>
                          <span className={`text-sm font-medium ${pct != null ? budgetColor(pct) : 'text-slate-400'}`}>
                            {formatARS(cat.monto)}
                            {plan && <span className="text-xs text-slate-500 ml-1">/ {formatARS(plan.monto_planificado)}</span>}
                          </span>
                        </div>
                        {plan && (
                          <div className="w-full bg-slate-700 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${pct <= 85 ? 'bg-emerald-500' : pct <= 100 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
