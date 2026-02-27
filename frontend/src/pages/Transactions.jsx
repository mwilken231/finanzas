import { useState, useEffect, useCallback } from 'react'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getCategories } from '../api'
import { formatARS, formatDate, currentMonth, sourceLabel, sourceColor } from '../utils'
import PeriodSelector from '../components/PeriodSelector'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'

export default function Transactions() {
  const [mes, setMes] = useState(currentMonth)
  const [data, setData] = useState({ total: 0, items: [] })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters
  const [tipo, setTipo] = useState('')
  const [catId, setCatId] = useState('')
  const [search, setSearch] = useState('')

  // Modal state
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editTx, setEditTx] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { mes, limit: 200 }
      if (tipo) params.tipo = tipo
      if (catId) params.categoria_id = catId
      if (search) params.search = search
      const [d, cats] = await Promise.all([
        getTransactions(params),
        getCategories(),
      ])
      setData(d)
      setCategories(cats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [mes, tipo, catId, search])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await createTransaction(form)
      setModal(null)
      load()
    } catch (e) {
      alert('Error al guardar: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    try {
      await updateTransaction(editTx.id, form)
      setModal(null)
      setEditTx(null)
      load()
    } catch (e) {
      alert('Error al guardar: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      setConfirmDelete(null)
      load()
    } catch (e) {
      alert('Error al eliminar')
    }
  }

  const openEdit = (tx) => {
    setEditTx(tx)
    setModal('edit')
  }

  const totalIngresos = data.items.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0)
  const totalGastos = data.items.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-white">Movimientos</h2>
        <div className="flex items-center gap-3">
          <PeriodSelector value={mes} onChange={setMes} />
          <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-1.5">
            <span className="text-lg leading-none">+</span> Nuevo
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xs text-slate-400 mb-1">Ingresos</div>
          <div className="text-base font-bold text-emerald-400">{formatARS(totalIngresos)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-400 mb-1">Gastos</div>
          <div className="text-base font-bold text-red-400">{formatARS(totalGastos)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-400 mb-1">Saldo</div>
          <div className={`text-base font-bold ${totalIngresos - totalGastos >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatARS(totalIngresos - totalGastos)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar concepto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-32 text-sm"
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input w-auto text-sm">
          <option value="">Todos</option>
          <option value="gasto">Gastos</option>
          <option value="ingreso">Ingresos</option>
        </select>
        <select value={catId} onChange={(e) => setCatId(e.target.value)} className="input w-auto text-sm">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-slate-700/50 p-0 overflow-hidden">
          {data.items.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500">
              Sin movimientos para este período
            </div>
          ) : (
            data.items.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors group">
                {/* Amount pill */}
                <div className={`text-center min-w-24 text-sm font-bold ${tx.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.tipo === 'ingreso' ? '+' : '-'}{formatARS(tx.monto)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={tx.tipo === 'ingreso' ? 'badge-ingreso' : 'badge-gasto'}>{tx.tipo}</span>
                    {tx.concepto && <span className="text-sm text-slate-200 font-medium">{tx.concepto}</span>}
                    {tx.categoria && <span className="text-xs text-slate-400">{tx.categoria.nombre}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500">{formatDate(tx.fecha)}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${sourceColor[tx.fuente] || sourceColor.manual}`}>
                      {sourceLabel[tx.fuente]}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => openEdit(tx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDelete(tx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Total count */}
      {!loading && data.total > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {data.items.length} de {data.total} movimientos
        </p>
      )}

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nuevo movimiento">
        <TransactionForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => { setModal(null); setEditTx(null) }} title="Editar movimiento">
        {editTx && (
          <TransactionForm
            initial={{
              fecha: editTx.fecha,
              concepto: editTx.concepto || '',
              tipo: editTx.tipo,
              monto: editTx.monto,
              moneda: editTx.moneda,
              categoria_id: editTx.categoria_id || '',
              fuente: editTx.fuente,
            }}
            onSubmit={handleEdit}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar eliminación" size="sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-slate-300">
              ¿Eliminar{' '}
              <span className="font-semibold text-white">
                {confirmDelete.concepto || confirmDelete.categoria?.nombre || 'este movimiento'}
              </span>
              {' '}de <span className="font-semibold text-white">{formatARS(confirmDelete.monto)}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
