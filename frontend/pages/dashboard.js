import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../lib/api'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData]       = useState(null)
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [dismissAlert, setDismissAlert] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user?.role === 'dispatcher') router.push('/deliveries')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      api.get('/dashboard'),
      api.get('/alerts'),
    ])
      .then(([dashRes, alertsRes]) => {
        setData(dashRes.data.data)
        setAlerts(alertsRes.data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading || loading) return <Layout><LoadingSpinner center /></Layout>

  const lowAlerts  = alerts.filter(a => a.status === 'low_stock')
  const outAlerts  = alerts.filter(a => a.status === 'out_of_stock')

  return (
    <Layout title="Dashboard">

      {/* Low stock alert banner */}
      {!dismissAlert && alerts.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 text-amber-800 rounded-lg px-4 py-3 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>{outAlerts.length > 0 ? `${outAlerts.length} out of stock` : ''}</strong>
              {outAlerts.length > 0 && lowAlerts.length > 0 ? ' and ' : ''}
              <strong>{lowAlerts.length > 0 ? `${lowAlerts.length} low stock` : ''}</strong>
              {' '}product{alerts.length > 1 ? 's need' : ' needs'} attention.{' '}
              <Link href="/products?stock_status=low" className="underline font-semibold hover:text-amber-900">View products →</Link>
            </span>
          </div>
          <button onClick={() => setDismissAlert(true)} className="text-amber-600 hover:text-amber-800 ml-4 font-bold text-lg leading-none">×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <KPICard label="Total Products"     value={data?.totalProducts}     icon="📦" />
        <KPICard label="Low Stock"          value={data?.lowStockCount}     icon="⚠️"  variant={data?.lowStockCount  > 0 ? 'warning' : 'default'} />
        <KPICard label="Out of Stock"       value={data?.outOfStockCount}   icon="🚫"  variant={data?.outOfStockCount > 0 ? 'danger'  : 'default'} />
        <KPICard label="Pending Receipts"   value={data?.pendingReceipts}   icon="📥" />
        <KPICard label="Pending Deliveries" value={data?.pendingDeliveries} icon="🚚" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Stock Movements */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Stock Movements</h2>
            <Link href="/move-history" className="text-xs text-primary-700 hover:underline">View all →</Link>
          </div>
          {!data?.recentMoves?.length ? (
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
                  {data.recentMoves.map((m, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-800">{m.product}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={m.type} /></td>
                      <td className={`py-2.5 pr-4 font-mono font-semibold ${m.type === 'delivery' ? 'text-red-600' : 'text-green-700'}`}>
                        {m.type === 'delivery' ? '−' : '+'}{parseFloat(m.qty).toFixed(2)}
                      </td>
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

        {/* Stock Alerts panel */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Stock Alerts</h2>
            <Link href="/products" className="text-xs text-primary-700 hover:underline">View products →</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-400">All products are well stocked</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {alerts.map((a, idx) => (
                <div key={idx} className={`rounded-lg px-3 py-2.5 border text-sm ${
                  a.status === 'out_of_stock'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${a.status === 'out_of_stock' ? 'text-red-800' : 'text-amber-800'}`}>
                        {a.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{a.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${a.status === 'out_of_stock' ? 'text-red-700' : 'text-amber-700'}`}>
                        {a.total_qty} {a.unit_of_measure}
                      </p>
                      <p className="text-xs text-gray-400">min: {a.reorder_point}</p>
                    </div>
                  </div>
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'out_of_stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {a.status === 'out_of_stock' ? 'Out of stock' : 'Low stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}