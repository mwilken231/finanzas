import { useState, useEffect, useCallback } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api'
import Modal from '../components/Modal'

const defaultForm = { nombre: '', tipo: 'gasto', orden: 0 }

export default function Categories() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [editCat, setEditCat] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [filterTipo, setFilterTipo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCategories(filterTipo || undefined)
      setCats(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }, [filterTipo])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editCat) {
        await updateCategory(editCat.id, form)
      } else {
        await createCategory(form)
      }
      setModal(null); setEditCat(null); setForm(defaultForm); load()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const gastos = cats.filter(c => c.tipo === 'gasto' || c.tipo === 'ambos')
  const ingresos = cats.filter(c => c.tipo === 'ingreso' || c.tipo === 'ambos')

  const renderGroup = (title, items) => items.length === 0 ? null : (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      <div className="divide-y divide-slate-700/50">
        {items.map((c) => (
          <div key={c.id} className="py-2.5 flex items-center gap-3 group">
            <div className="flex-1 min-w-0">
              <span className="text-sm text-slate-200">{c.nombre}</span>
            </div>
            {!c.activo && <span className="text-xs text-slate-500">Inactiva</span>}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditCat(c); setForm({ nombre: c.nombre, tipo: c.tipo, orden: c.orden }); setModal('form') }}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
              >✏️</button>
              <button
                onClick={async () => { if (confirm(`¿Desactivar "${c.nombre}"?`)) { await deleteCategory(c.id); load() } }}
                className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Categorías</h2>
        <button onClick={() => { setEditCat(null); setForm(defaultForm); setModal('form') }} className="btn-primary">+ Nueva</button>
      </div>

      <div className="flex gap-2">
        {['', 'gasto', 'ingreso'].map(t => (
          <button key={t} onClick={() => setFilterTipo(t)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterTipo === t ? 'bg-brand-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {t === '' ? 'Todas' : t === 'gasto' ? 'Gastos' : 'Ingresos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {renderGroup('Gastos', gastos)}
          {renderGroup('Ingresos', ingresos)}
        </>
      )}

      <Modal open={modal === 'form'} onClose={() => { setModal(null); setEditCat(null) }} title={editCat ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <div className="space-y-4">
          <div><label className="label">Nombre</label><input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" /></div>
          <div>
            <label className="label">Tipo</label>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div><label className="label">Orden</label><input type="number" value={form.orden} onChange={(e) => set('orden', parseInt(e.target.value) || 0)} className="input" /></div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </Modal>
    </div>
  )
}
