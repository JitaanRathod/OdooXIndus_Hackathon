import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, Inbox, Truck, ArrowLeftRight,
  ClipboardList, History, Warehouse, Users, LogOut, Menu, X,
  ChevronRight, TrendingUp
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, roles: ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'] },
  { href: '/products', label: 'Products', Icon: Package, roles: ['admin', 'inventory_manager', 'warehouse_staff'] },
  { href: '/receipts', label: 'Receipts', Icon: Inbox, roles: ['admin', 'inventory_manager', 'warehouse_staff'] },
  { href: '/deliveries', label: 'Deliveries', Icon: Truck, roles: ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'] },
  { href: '/transfers', label: 'Transfers', Icon: ArrowLeftRight, roles: ['admin', 'inventory_manager', 'warehouse_staff'] },
  { href: '/adjustments', label: 'Adjustments', Icon: ClipboardList, roles: ['admin', 'inventory_manager', 'warehouse_staff'] },
  { href: '/move-history', label: 'Move History', Icon: History, roles: ['admin', 'inventory_manager'] },
  { href: '/warehouses', label: 'Warehouses', Icon: Warehouse, roles: ['admin'] },
  { href: '/users', label: 'Users', Icon: Users, roles: ['admin'] },
]

const ROLE_META = {
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-200' },
  inventory_manager: { label: 'Inv. Manager', color: 'bg-blue-500/20   text-blue-200' },
  warehouse_staff: { label: 'WH Staff', color: 'bg-green-500/20  text-green-200' },
  dispatcher: { label: 'Dispatcher', color: 'bg-amber-500/20  text-amber-200' },
}

function getAvatarColor(name = '') {
  const colors = ['bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500']
  let hash = 0
  for (const c of name) hash = (hash << 5) - hash + c.charCodeAt(0)
  return colors[Math.abs(hash) % colors.length]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const links = NAV.filter(n => !user?.role || n.roles.includes(user.role))
  const meta = ROLE_META[user?.role] || { label: user?.role, color: 'bg-gray-500/20 text-gray-200' }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">Stockify</span>
            <p className="text-[10px] text-primary-300 leading-none mt-0.5">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {links.map((link) => {
          const active = router.pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                  ? 'bg-white/15 text-white'
                  : 'text-primary-300 hover:bg-white/8 hover:text-white'
                }`}
              style={{ '--translate-x': active ? '0' : '' }}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full"
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                />
              )}
              <link.Icon
                className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${active ? 'text-white' : 'text-primary-400 group-hover:text-white group-hover:scale-110'
                  }`}
              />
              <span className="truncate">{link.label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-white/50" />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getAvatarColor(user?.name)}`}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-primary-400 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${meta.color}`}>
            {meta.label}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-white transition-colors group"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md rounded-xl p-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            className="fixed top-0 left-0 h-screen w-64 z-50 md:hidden"
            style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar — always visible */}
      <aside
        className="hidden md:flex md:flex-col fixed top-0 left-0 h-screen w-60"
        style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}