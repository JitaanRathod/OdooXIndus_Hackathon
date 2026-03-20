import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Package, Inbox, Truck, ArrowLeftRight,
  AlertTriangle, XCircle, Clock, TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([api.get('/dashboard'), api.get('/alerts')])
      .then(([d, a]) => { setStats(d.data.data); setAlerts(a.data.data || []) })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [user])

  const kpis = stats ? [
    { label: 'Active Products', value: stats.totalProducts, Icon: Package, variant: 'default', delay: 0 },
    { label: 'Pending Receipts', value: stats.pendingReceipts, Icon: Inbox, variant: stats.pendingReceipts > 0 ? 'warning' : 'success', delay: 0.06 },
    { label: 'Pending Deliveries', value: stats.pendingDeliveries, Icon: Truck, variant: stats.pendingDeliveries > 0 ? 'warning' : 'success', delay: 0.12 },
    { label: 'Transfers Scheduled', value: stats.scheduledTransfers, Icon: ArrowLeftRight, variant: 'default', delay: 0.18 },
    { label: 'Low Stock Items', value: stats.lowStockCount, Icon: AlertTriangle, variant: stats.lowStockCount > 0 ? 'warning' : 'success', delay: 0.24 },
    { label: 'Out of Stock', value: stats.outOfStockCount, Icon: XCircle, variant: stats.outOfStockCount > 0 ? 'danger' : 'success', delay: 0.30 },
  ] : []

  return (
    <Layout title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))
          : kpis.map(k => <KPICard key={k.label} {...k} />)
        }
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Stock Moves */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900">Recent Stock Moves</h2>
            </div>
            <button onClick={() => router.push('/move-history')} className="text-xs text-primary-600 hover:underline font-medium">View all →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-2 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))
              : (stats?.recentMoves || []).length === 0
                ? <p className="px-5 py-8 text-center text-sm text-gray-400">No recent stock moves</p>
                : stats.recentMoves.map((m, i) => (
                  <motion.div
                    key={i}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/60 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${m.type === 'delivery' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                      {m.type === 'delivery' ? '↓' : '↑'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.product}</p>
                      <p className="text-xs text-gray-400">{m.fromLocation || 'External'} → {m.toLocation || 'External'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${m.type === 'delivery' ? 'text-red-600' : 'text-green-600'}`}>
                        {m.type === 'delivery' ? '−' : '+'}{parseFloat(m.qty).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.div>
                ))
            }
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-gray-900">Stock Alerts</h2>
            </div>
            {alerts.length > 0 && (
              <span className="badge badge-red text-[10px]">{alerts.length}</span>
            )}
          </div>
          <div className="overflow-y-auto max-h-80">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-3 animate-pulse flex gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
              : alerts.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                      <Package className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-green-700">All stock levels OK</p>
                  </div>
                )
                : alerts.map((a, i) => (
                  <motion.div
                    key={a.id}
                    className={`px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${a.status === 'out_of_stock' ? 'border-l-2 border-l-red-400' : 'border-l-2 border-l-amber-400'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{a.sku}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Stock: <span className="font-bold text-gray-700">{a.total_qty}</span> /  Reorder: {a.reorder_point}
                    </p>
                  </motion.div>
                ))
            }
          </div>
        </div>
      </div>
    </Layout>
  )
}