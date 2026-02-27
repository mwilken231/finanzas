import { useState, useEffect } from 'react'
import { getCategories } from '../api'
import { today } from '../utils'

const defaultForm = {
  fecha: today(),
  concepto: '',
  tipo: 'gasto',
  monto: '',
  moneda: 'ARS',
  categoria_id: '',
  fuente: 'manual',
}

export default function TransactionForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || defaultForm)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const filtered = categories.filter(
    (c) => c.tipo === form.tipo || c.tipo === 'ambos'
  )

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      monto: parseFloat(form.monto),
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo */}
      <div className="flex gap-2">
        {['gasto', 'ingreso'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { set('tipo', t); set('categoria_id', '') }}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              form.tipo === t
                ? t === 'gasto'
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {t === 'gasto' ? '💸 Gasto' : '💰 Ingreso'}
          </button>
        ))}
      </div>

      {/* Monto */}
      <div>
        <label className="label">Monto (ARS)</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0"
          value={form.monto}
          onChange={(e) => set('monto', e.target.value)}
          className="input text-right text-lg font-bold"
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="label">Categoría</label>
        <select
          value={form.categoria_id}
          onChange={(e) => set('categoria_id', e.target.value)}
          className="input"
        >
          <option value="">Sin categoría</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Concepto */}
      <div>
        <label className="label">Concepto</label>
        <input
          type="text"
          placeholder="súper, farmacia, Uber..."
          value={form.concepto}
          onChange={(e) => set('concepto', e.target.value)}
          className="input"
        />
      </div>

      {/* Fecha */}
      <div>
        <label className="label">Fecha</label>
        <input
          type="date"
          required
          value={form.fecha}
          onChange={(e) => set('fecha', e.target.value)}
          className="input"
        />
      </div>

      {/* Fuente */}
      <div>
        <label className="label">Fuente</label>
        <select value={form.fuente} onChange={(e) => set('fuente', e.target.value)} className="input">
          <option value="manual">Manual</option>
          <option value="telegram_bot">Bot de Telegram</option>
          <option value="recurrente">Recurrente</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-3 text-base"
      >
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
