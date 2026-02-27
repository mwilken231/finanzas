import { useState, useEffect, useCallback } from 'react'
import { getPlans, createPlan, updatePlan, deletePlan, copyPlan, getCategories } from '../api'
import { formatARS, currentMonth, addMonth } from '../utils'
import PeriodSelector from '../components/PeriodSelector'
import Modal from '../components/Modal'
import SubItemsEditor from '../components/SubItemsEditor'

function parseItems(detalle) {
  try { return JSON.parse(detalle)?.items || [] } catch { return [] }
}

function sumItems(items) {
  return items.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0)
}

function PlanRow({ plan, onEdit, onDelete, onSaveItems }) {
  const [open, setOpen] = useState(false)
  const items = parseItems(plan.detalle)

  return (
    <div>
      {/* Main row */}
      <div className="px-4 py-3 flex items-center gap-2 hover:bg-slate-700/20 group">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          title={open ? 'Colapsar' : 'Expandir sub-ítems'}
        >
          {items.length > 0
            ? <span className="text-xs">{open ? '▼' : '▶'}</span>
            : <span className="text-xs text-slate-700">▶</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{plan.categoria?.nombre || 'Sin categoría'}</span>
            {plan.es_recurrente && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">recurrente</span>}
            {items.length > 0 && <span className="text-xs text-slate-500">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        <span className="font-semibold text-slate-200 text-sm">{formatARS(plan.monto_planificado)}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(plan)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">✏️</button>
          <button onClick={() => onDelete(plan.id)} className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">🗑️</button>
        </div>
      </div>

      {/* Sub-items */}
      {open && (
        <SubItemsEditor
          items={items}
          planId={plan.id}
          onSave={onSaveItems}
        />
      )}
    </div>
  )
}

export default function ExpensePlan() {
  const [mes, setMes] = useState(currentMonth)
  const [plans, setPlans] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [editPlan, setEditPlan] = useState(null)
  const [form, setForm] = useState({ categoria_id: '', monto_planificado: '', es_recurrente: false, items: [] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, cats] = await Promise.all([getPlans(mes, 'gasto'), getCategories('gasto')])
      setPlans(p); setCategories(cats)
    } finally { setLoading(false) }
  }, [mes])

  useEffect(() => { load() }, [load])

  const openEdit = (plan) => {
    setEditPlan(plan)
    setForm({
      categoria_id: plan.categoria_id,
      monto_planificado: plan.monto_planificado,
      es_recurrente: plan.es_recurrente,
      items: parseItems(plan.detalle),
    })
    setModal('form')
  }

  const openNew = () => {
    setEditPlan(null)
    setForm({ categoria_id: '', monto_planificado: '', es_recurrente: false, items: [] })
    setModal('form')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const [year, month] = mes.split('-')
      const itemTotal = sumItems(form.items)
      const monto = form.items.length > 0 ? itemTotal : (parseFloat(form.monto_planificado) || 0)
      const detalle = form.items.length > 0 ? JSON.stringify({ items: form.items }) : null

      const data = {
        mes: `${year}-${month}-01`, tipo: 'gasto',
        categoria_id: parseInt(form.categoria_id) || null,
        monto_planificado: monto,
        es_recurrente: form.es_recurrente,
        detalle,
      }
      if (editPlan) {
        await updatePlan(editPlan.id, { monto_planificado: data.monto_planificado, es_recurrente: data.es_recurrente, detalle: data.detalle })
      } else {
        await createPlan(data)
      }
      setModal(null); setEditPlan(null)
      load()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  const handleSaveItems = async (planId, updates) => {
    await updatePlan(planId, updates)
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p))
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar?')) { await deletePlan(id); load() }
  }

  const handleCopy = async () => {
    const prev = addMonth(mes, -1)
    if (!confirm(`¿Copiar plan recurrente de ${prev} a ${mes}?`)) return
    try {
      const r = await copyPlan(prev, mes)
      alert(`Se copiaron ${r.copied} ítems`)
      load()
    } catch { alert('Error al copiar') }
  }

  const total = plans.reduce((s, p) => s + p.monto_planificado, 0)
  const itemTotal = sumItems(form.items)

  const addFormItem = () => setForm(f => ({ ...f, items: [...f.items, { nombre: '', monto: 0 }] }))
  const removeFormItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  const updateFormItem = (idx, field, value) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: field === 'monto' ? parseFloat(value) || 0 : value } : item) }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Plan de Gastos</h2>
        <PeriodSelector value={mes} onChange={setMes} />
      </div>

      <div className="flex gap-2">
        <button onClick={openNew} className="btn-primary">+ Agregar</button>
        <button onClick={handleCopy} className="btn-secondary">Copiar mes anterior</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="card divide-y divide-slate-700/50 p-0 overflow-hidden">
          {plans.length === 0 ? (
            <p className="px-5 py-10 text-center text-slate-500">Sin plan para este período</p>
          ) : plans.map((p) => (
            <PlanRow key={p.id} plan={p} onEdit={openEdit} onDelete={handleDelete} onSaveItems={handleSaveItems} />
          ))}
          <div className="px-4 py-3 flex justify-between font-semibold">
            <span className="text-slate-300">Total planificado</span>
            <span className="text-white">{formatARS(total)}</span>
          </div>
        </div>
      )}

      <Modal open={modal === 'form'} onClose={() => { setModal(null); setEditPlan(null) }} title={editPlan ? 'Editar ítem' : 'Nuevo ítem de gasto'}>
        <div className="space-y-4">
          {!editPlan && (
            <div>
              <label className="label">Categoría</label>
              <select value={form.categoria_id} onChange={(e) => setForm(f => ({ ...f, categoria_id: e.target.value }))} className="input">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}

          {/* Sub-items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Sub-ítems</label>
              <button onClick={addFormItem} className="text-xs text-brand-400 hover:text-brand-300">+ Agregar</button>
            </div>
            {form.items.length > 0 ? (
              <div className="border border-slate-700 rounded-lg overflow-hidden divide-y divide-slate-700/60">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60">
                    <input
                      className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-600 border-b border-slate-600 focus:border-slate-400 outline-none py-0.5"
                      placeholder="Concepto"
                      value={item.nombre}
                      onChange={(e) => updateFormItem(idx, 'nombre', e.target.value)}
                    />
                    <input
                      className="w-28 bg-transparent text-sm text-right text-slate-300 placeholder-slate-600 border-b border-slate-600 focus:border-slate-400 outline-none py-0.5"
                      type="number"
                      placeholder="0"
                      value={item.monto || ''}
                      onChange={(e) => updateFormItem(idx, 'monto', e.target.value)}
                    />
                    <button onClick={() => removeFormItem(idx)} className="text-slate-600 hover:text-red-400 text-xs px-1">✕</button>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-1.5 bg-slate-900/40">
                  <span className="text-xs text-slate-500">Total sub-ítems</span>
                  <span className="text-xs font-semibold text-slate-300">{formatARS(itemTotal)}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Monto planificado</label>
                <input type="number" value={form.monto_planificado} onChange={(e) => setForm(f => ({ ...f, monto_planificado: e.target.value }))} className="input" placeholder="0" />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.es_recurrente} onChange={(e) => setForm(f => ({ ...f, es_recurrente: e.target.checked }))} className="w-4 h-4 accent-brand-500" />
            Recurrente (se copia al mes siguiente)
          </label>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
