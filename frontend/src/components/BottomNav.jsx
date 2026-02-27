import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard',    label: 'Inicio',      icon: '📊' },
  { to: '/transactions', label: 'Movimientos', icon: '💸' },
  { to: '/consolidated', label: 'Resumen',     icon: '📋' },
  { to: '/expense-plan', label: 'Plan',        icon: '📉' },
  { to: '/credit-cards', label: 'Cuotas',      icon: '💳' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-800 border-t border-slate-700/50 z-30 safe-area-inset-bottom">
      <div className="flex">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
                isActive ? 'text-brand-400' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl leading-none mb-0.5">{icon}</span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
