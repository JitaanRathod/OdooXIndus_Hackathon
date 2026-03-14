import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: '📊', roles: ['admin','inventory_manager','warehouse_staff','dispatcher'] },
  { href: '/products',     label: 'Products',     icon: '📦', roles: ['admin','inventory_manager','warehouse_staff'] },
  { href: '/receipts',     label: 'Receipts',     icon: '📥', roles: ['admin','inventory_manager','warehouse_staff'] },
  { href: '/deliveries',   label: 'Deliveries',   icon: '🚚', roles: ['admin','inventory_manager','warehouse_staff','dispatcher'] },
  { href: '/transfers',    label: 'Transfers',    icon: '🔄', roles: ['admin','inventory_manager','warehouse_staff'] },
  { href: '/adjustments',  label: 'Adjustments',  icon: '🔧', roles: ['admin','inventory_manager','warehouse_staff'] },
  { href: '/move-history', label: 'Move History', icon: '📋', roles: ['admin','inventory_manager'] },
  { href: '/warehouses',   label: 'Warehouses',   icon: '🏭', roles: ['admin'] },
  { href: '/users',        label: 'Users',        icon: '👥', roles: ['admin'] },
]

const ROLE_COLORS = {
  admin:             'bg-primary-100 text-primary-800',
  inventory_manager: 'bg-blue-100 text-blue-800',
  warehouse_staff:   'bg-green-100 text-green-800',
  dispatcher:        'bg-amber-100 text-amber-800',
}

const ROLE_LABELS = {
  admin:             'Admin',
  inventory_manager: 'Inv. Manager',
  warehouse_staff:   'WH Staff',
  dispatcher:        'Dispatcher',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const links = NAV.filter((n) => !user?.role || n.roles.includes(user.role))

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow rounded-lg p-2"
        onClick={() => setOpen(!open)}
      >
        <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-700" />
      </button>

      {/* Overlay on mobile */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-60 bg-primary-900 text-white z-40 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-primary-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span className="text-lg font-bold tracking-tight">Stockify</span>
          </div>
          <p className="text-primary-400 text-xs mt-0.5">Inventory Management</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map((link) => {
            const active = router.pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                  }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-primary-800">
          <div className="mb-3">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-primary-400 truncate">{user?.email}</p>
            <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user?.role] || 'bg-gray-200 text-gray-700'}`}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-primary-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  )
}