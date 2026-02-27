import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts'
import { getDashboardSummary, getDashboardChart } from '../api'
import {
  formatARS, currentMonth, formatDate, sourceLabel, sourceColor,
  budgetColor, progressColor, CATEGORY_COLORS, shortMonth,
} from '../utils'
import PeriodSelector from '../components/PeriodSelector'
import StatCard from '../components/StatCard'

// ── Custom tooltip for bar chart ─────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatARS(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Custom active pie shape ───────────────────────────────────────────────────
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9" className="text-sm" fontSize={13} fontWeight={600}>
        {payload.categoria_nombre.length > 16 ? payload.categoria_nombre.slice(0, 16) + '…' : payload.categoria_nombre}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {formatARS(value)} · {percent.toFixed(1)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

export default function Dashboard() {
  const [mes, setMes] = useState(currentMonth)
  const [summary, setSummary] = useState(null)
  const [chart, setChart] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        getDashboardSummary(mes),
        getDashboardChart(6),
      ])
      setSummary(s)
      setChart(c)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { load() }, [load])

  const pct = summary?.pct_gasto_vs_plan

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <PeriodSelector value={mes} onChange={setMes} />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Ingresos"
              amount={summary.ingreso_total}
              icon="💰"
              color="text-emerald-400"
              sub={summary.presupuesto_ingresos > 0
                ? `Plan: ${formatARS(summary.presupuesto_ingresos)}`
                : undefined}
            />
            <StatCard
              label="Gastos"
              amount={summary.gasto_total}
              icon="💸"
              color="text-red-400"
              sub={summary.presupuesto_gastos > 0
                ? `Plan: ${formatARS(summary.presupuesto_gastos)}`
                : undefined}
            />
            <StatCard
              label="Saldo"
              amount={summary.saldo}
              icon="🏦"
              color={summary.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <div className="card flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>📊</span> Presupuesto
              </div>
              {pct != null ? (
                <>
                  <div className={`text-2xl font-bold ${budgetColor(pct)}`}>{pct}%</div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${progressColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500">del plan de gastos</div>
                </>
              ) : (
                <div className="text-2xl font-bold text-slate-500">—</div>
              )}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Bar chart: last 6 months */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Ingresos vs Gastos (6 meses)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chart} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis dataKey="mes" tickFormatter={shortMonth} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend
                    formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
                    iconSize={10}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart: gastos por categoría */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Gastos por categoría</h3>
              {summary.gastos_por_categoria.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={summary.gastos_por_categoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="monto"
                      nameKey="categoria_nombre"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                    >
                      {summary.gastos_por_categoria.map((_, idx) => (
                        <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                  Sin gastos en este período
                </div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Últimos movimientos</h3>
            {summary.ultimas_transacciones.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">Sin movimientos en este período</p>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {summary.ultimas_transacciones.map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={tx.tipo === 'ingreso' ? 'badge-ingreso' : 'badge-gasto'}>
                          {tx.tipo}
                        </span>
                        <span className="text-sm text-slate-200 truncate">
                          {tx.concepto || tx.categoria?.nombre || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{formatDate(tx.fecha)}</span>
                        {tx.categoria && (
                          <span className="text-xs text-slate-500">· {tx.categoria.nombre}</span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${sourceColor[tx.fuente] || sourceColor.manual}`}>
                          {sourceLabel[tx.fuente]}
                        </span>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm whitespace-nowrap ${tx.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.tipo === 'ingreso' ? '+' : '-'}{formatARS(tx.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
