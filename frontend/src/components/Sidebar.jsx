import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',     icon: '📊' },
  { to: '/transactions', label: 'Movimientos',    icon: '💸' },
  { to: '/consolidated', label: 'Consolidado',    icon: '📋' },
  { to: '/expense-plan', label: 'Plan Gastos',    icon: '📉' },
  { to: '/income-plan',  label: 'Plan Ingresos',  icon: '📈' },
  { to: '/credit-cards', label: 'Cuotas',         icon: '💳' },
  { to: '/categories',   label: 'Categorías',     icon: '🏷️'  },
]

export default function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 bg-slate-800 border-r border-slate-700/50 z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white">💰 Finanzas</h1>
        <p className="text-xs text-slate-400 mt-0.5">Personales</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <span>🚪</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
