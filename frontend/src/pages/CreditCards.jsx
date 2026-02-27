import { useState, useEffect, useCallback } from 'react'
import { getCards, createCard, updateCard, advanceCard, deleteCard } from '../api'
import { formatARS } from '../utils'
import Modal from '../components/Modal'

const defaultForm = { concepto: '', tarjeta: '', monto_cuota: '', cuota_actual: 1, cuotas_totales: 12, nota: '' }

export default function CreditCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [showInactive, setShowInactive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCards(showInactive ? undefined : true)
      setCards(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }, [showInactive])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createCard({
        ...form,
        monto_cuota: parseFloat(form.monto_cuota),
        cuota_actual: parseInt(form.cuota_actual),
        cuotas_totales: parseInt(form.cuotas_totales),
      })
      setModal(null); setForm(defaultForm); load()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  const handleAdvance = async (id) => {
    try { await advanceCard(id); load() } catch (e) { alert('Error') }
  }

  const total = cards.reduce((s, c) => s + c.monto_cuota, 0)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Cuotas pendientes</h2>
        <button onClick={() => { setForm(defaultForm); setModal('create') }} className="btn-primary">+ Agregar</button>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-4 h-4 accent-brand-500" />
        Mostrar completadas
      </label>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="card divide-y divide-slate-700/50 p-0 overflow-hidden">
            {cards.length === 0 ? (
              <p className="px-5 py-10 text-center text-slate-500">Sin cuotas activas</p>
            ) : cards.map((c) => {
              const pct = (c.cuota_actual / c.cuotas_totales) * 100
              return (
                <div key={c.id} className="px-4 py-3 group">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{c.concepto}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{c.tarjeta}</span>
                        {!c.activo && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Completa</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">Cuota {c.cuota_actual}/{c.cuotas_totales}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      {c.nota && <p className="text-xs text-slate-500 mt-0.5">{c.nota}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-200">{formatARS(c.monto_cuota)}</div>
                      <div className="text-xs text-slate-500">por cuota</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.activo && (
                        <button onClick={() => handleAdvance(c.id)} title="Avanzar cuota" className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">✓</button>
                      )}
                      <button onClick={async () => { if (confirm('¿Eliminar?')) { await deleteCard(c.id); load() } }} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
            {cards.length > 0 && (
              <div className="px-4 py-3 flex justify-between font-semibold">
                <span className="text-slate-300">Total cuotas del mes</span>
                <span className="text-white">{formatARS(total)}</span>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nueva cuota en cuotas">
        <div className="space-y-4">
          <div><label className="label">Concepto</label><input value={form.concepto} onChange={(e) => set('concepto', e.target.value)} className="input" placeholder="Heladera, PSA, Préstamo..." /></div>
          <div><label className="label">Tarjeta</label><input value={form.tarjeta} onChange={(e) => set('tarjeta', e.target.value)} className="input" placeholder="Galicia Mastercard..." /></div>
          <div><label className="label">Monto por cuota</label><input type="number" value={form.monto_cuota} onChange={(e) => set('monto_cuota', e.target.value)} className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cuota actual</label><input type="number" min="1" value={form.cuota_actual} onChange={(e) => set('cuota_actual', e.target.value)} className="input" /></div>
            <div><label className="label">Total cuotas</label><input type="number" min="1" value={form.cuotas_totales} onChange={(e) => set('cuotas_totales', e.target.value)} className="input" /></div>
          </div>
          <div><label className="label">Nota (opcional)</label><input value={form.nota} onChange={(e) => set('nota', e.target.value)} className="input" /></div>
          <button onClick={handleCreate} disabled={saving} className="btn-primary w-full py-3">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>
    </div>
  )
}
