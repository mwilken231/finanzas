import { useState } from 'react'
import { formatARS } from '../utils'

const ESTADOS = ['pendiente', 'en_reserva', 'pagado']

const ESTADO_STYLE = {
  pagado:     { label: 'Pagado',     bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  en_reserva: { label: 'En reserva', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

function nextEstado(current) {
  const idx = ESTADOS.indexOf(current || 'pendiente')
  return ESTADOS[(idx + 1) % ESTADOS.length]
}

function sumItems(items) {
  return items.reduce((s, i) => s + (parseFloat(i.monto) || 0), 0)
}

export default function SubItemsEditor({ items, planId, onSave, accentColor = 'brand' }) {
  const [list, setList] = useState(
    items.map(i => ({ estado: 'pendiente', nota: '', ...i }))
  )
  const [newNombre, setNewNombre] = useState('')
  const [newMonto, setNewMonto] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedNota, setExpandedNota] = useState(null) // index of expanded nota

  const save = async (newList) => {
    setSaving(true)
    try {
      const total = sumItems(newList)
      await onSave(planId, {
        detalle: JSON.stringify({ items: newList }),
        monto_planificado: total > 0 ? total : 0,
      })
      setList(newList)
    } finally {
      setSaving(false)
    }
  }

  const addItem = async () => {
    if (!newNombre.trim() || !newMonto) return
    const updated = [...list, { nombre: newNombre.trim(), monto: parseFloat(newMonto), estado: 'pendiente', nota: '' }]
    setNewNombre(''); setNewMonto('')
    await save(updated)
  }

  const removeItem = (idx) => save(list.filter((_, i) => i !== idx))

  const updateField = (idx, field, value) => {
    const updated = list.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'monto' ? parseFloat(value) || 0 : value } : item
    )
    setList(updated)
    return updated
  }

  const commitField = (idx, field, value) => {
    const updated = updateField(idx, field, value)
    save(updated)
  }

  const cycleEstado = (idx) => {
    const updated = list.map((item, i) =>
      i === idx ? { ...item, estado: nextEstado(item.estado) } : item
    )
    save(updated)
  }

  const total = sumItems(list)
  const pagado = list.filter(i => i.estado === 'pagado').reduce((s, i) => s + i.monto, 0)
  const reserva = list.filter(i => i.estado === 'en_reserva').reduce((s, i) => s + i.monto, 0)

  return (
    <div className="ml-7 mr-4 mb-3 border border-slate-700/60 rounded-lg overflow-hidden bg-slate-800/40">

      {/* Summary bar */}
      {list.length > 0 && (
        <div className="flex gap-4 px-3 py-1.5 bg-slate-900/60 border-b border-slate-700/40 text-xs">
          <span className="text-emerald-400 font-medium">✓ {formatARS(pagado)}</span>
          <span className="text-blue-400">◉ {formatARS(reserva)}</span>
          <span className="text-slate-500 ml-auto">Total: {formatARS(total)}</span>
        </div>
      )}

      {list.length === 0 && (
        <p className="px-4 py-2 text-xs text-slate-500 italic">Sin sub-ítems aún</p>
      )}

      {list.map((item, idx) => {
        const estilo = ESTADO_STYLE[item.estado] || ESTADO_STYLE.pendiente
        const notaOpen = expandedNota === idx

        return (
          <div key={idx} className="border-b border-slate-700/40 last:border-0">
            {/* Main row */}
            <div className="flex items-center gap-2 px-3 py-1.5 group/item">
              <input
                className="flex-1 bg-transparent text-xs text-slate-300 border-b border-transparent focus:border-slate-500 outline-none py-0.5 min-w-0"
                value={item.nombre}
                onChange={(e) => updateField(idx, 'nombre', e.target.value)}
                onBlur={(e) => commitField(idx, 'nombre', e.target.value)}
              />
              <input
                className="w-24 bg-transparent text-xs text-right text-slate-300 border-b border-transparent focus:border-slate-500 outline-none py-0.5 flex-shrink-0"
                type="number"
                value={item.monto || ''}
                onChange={(e) => updateField(idx, 'monto', e.target.value)}
                onBlur={(e) => commitField(idx, 'monto', e.target.value)}
              />
              {/* Estado badge — click to cycle */}
              <button
                onClick={() => cycleEstado(idx)}
                title="Cambiar estado"
                className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded border ${estilo.bg} whitespace-nowrap transition-all`}
              >
                {estilo.label}
              </button>
              {/* Nota toggle */}
              <button
                onClick={() => setExpandedNota(notaOpen ? null : idx)}
                title="Agregar nota"
                className={`flex-shrink-0 text-xs px-1 transition-colors ${item.nota ? 'text-slate-300' : 'text-slate-600 opacity-0 group-hover/item:opacity-100'} hover:text-slate-300`}
              >
                {item.nota ? '📝' : '✎'}
              </button>
              {/* Delete */}
              <button
                onClick={() => removeItem(idx)}
                className="opacity-0 group-hover/item:opacity-100 text-slate-600 hover:text-red-400 transition-all text-xs px-1 flex-shrink-0"
              >✕</button>
            </div>

            {/* Nota inline */}
            {(notaOpen || item.nota) && (
              <div className="px-3 pb-1.5">
                <input
                  autoFocus={notaOpen && !item.nota}
                  className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 border-b border-slate-700 focus:border-slate-500 outline-none py-0.5 italic"
                  placeholder="Nota..."
                  value={item.nota || ''}
                  onChange={(e) => updateField(idx, 'nota', e.target.value)}
                  onBlur={(e) => {
                    commitField(idx, 'nota', e.target.value)
                    if (!e.target.value) setExpandedNota(null)
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Add row */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60">
        <input
          className="flex-1 bg-transparent text-xs text-slate-400 placeholder-slate-600 border-b border-slate-600 focus:border-slate-400 outline-none py-0.5"
          placeholder="Concepto..."
          value={newNombre}
          onChange={(e) => setNewNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <input
          className="w-24 bg-transparent text-xs text-right text-slate-400 placeholder-slate-600 border-b border-slate-600 focus:border-slate-400 outline-none py-0.5"
          type="number"
          placeholder="0"
          value={newMonto}
          onChange={(e) => setNewMonto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <button
          onClick={addItem}
          disabled={saving || !newNombre.trim() || !newMonto}
          className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 px-1 font-medium whitespace-nowrap"
        >
          {saving ? '…' : '+ Add'}
        </button>
      </div>
    </div>
  )
}
