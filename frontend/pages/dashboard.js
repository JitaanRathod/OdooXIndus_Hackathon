import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import KPICard from '../components/KPICard'
import AlertBanner from '../components/AlertBanner'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissAlert, setDismissAlert] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  useEffect(() => {
    if (user) {
      api.get('/dashboard')
        .then(({ data: res }) => setData(res.data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user])

  if (authLoading || loading) return <Layout><LoadingSpinner center /></Layout>

  return (
    <Layout title="Dashboard">
      {!dismissAlert && <AlertBanner count={data?.lowStockCount} onDismiss={() => setDismissAlert(true)} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <KPICard label="Total Products"      value={data?.totalProducts}      icon="📦" />
        <KPICard label="Low Stock"           value={data?.lowStockCount}      icon="⚠️" variant={data?.lowStockCount > 0 ? 'warning' : 'default'} />
        <KPICard label="Out of Stock"        value={data?.outOfStockCount}    icon="🚫" variant={data?.outOfStockCount > 0 ? 'danger' : 'default'} />
        <KPICard label="Pending Receipts"    value={data?.pendingReceipts}    icon="📥" />
        <KPICard label="Pending Deliveries"  value={data?.pendingDeliveries}  icon="🚚" />
      </div>

      {/* Recent Moves */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Stock Movements</h2>
        {data?.recentMoves?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No recent movements</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left pb-3 pr-4">Product</th>
                  <th className="text-left pb-3 pr-4">Type</th>
                  <th className="text-left pb-3 pr-4">Qty</th>
                  <th className="text-left pb-3 pr-4">Location</th>
                  <th className="text-left pb-3 pr-4">User</th>
                  <th className="text-left pb-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.recentMoves?.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{m.product}</td>
                    <td className="py-2.5 pr-4"><StatusBadge status={m.type} /></td>
                    <td className="py-2.5 pr-4 font-mono text-gray-700">{m.qty}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{m.toLocation || m.fromLocation || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-600">{m.user}</td>
                    <td className="py-2.5 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}