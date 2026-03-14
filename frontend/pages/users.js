import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import api from '../lib/api'

const ROLES = ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher']

const ROLE_LABELS = {
  admin:             'Admin',
  inventory_manager: 'Inventory Manager',
  warehouse_staff:   'Warehouse Staff',
  dispatcher:        'Dispatcher',
}

const ROLE_COLORS = {
  admin:             'bg-purple-100 text-purple-700',
  inventory_manager: 'bg-blue-100 text-blue-700',
  warehouse_staff:   'bg-green-100 text-green-700',
  dispatcher:        'bg-amber-100 text-amber-700',
}

export default function Users() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user && user.role !== 'admin') router.push('/dashboard')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    api.get('/users')
      .then(({ data }) => setUsers(data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleRoleChange = async (u, role) => {
    try { await api.put(`/users/${u.id}`, { role }); load() }
    catch (err) { alert(err.response?.data?.message || 'Failed to update role') }
  }

  // FIX: replaced hard delete with soft deactivate
  // Hard delete fails with FK constraint when user has created deliveries/receipts/etc.
  // Deactivating blocks login without breaking any existing records.
  const handleToggleActive = async (u) => {
    const action = u.is_active ? 'deactivate' : 'reactivate'
    if (!confirm(`Are you sure you want to ${action} "${u.name}"?`)) return
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); load() }
    catch (err) { alert(err.response?.data?.message || 'Failed to update user') }
  }

  const cols = [
    { key: 'name', label: 'Name', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
          {v?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900">{v}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (v, row) => (
      row.id === user?.id ? (
        // Can't change your own role
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[v]}`}>
          {ROLE_LABELS[v]}
        </span>
      ) : (
        <select
          value={v}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      )
    )},
    { key: 'is_active', label: 'Status', render: (v) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {v ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions', label: '', render: (_, row) => (
      row.id !== user?.id ? (
        <button
          onClick={() => handleToggleActive(row)}
          className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
            row.is_active
              ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
              : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
          }`}
        >
          {row.is_active ? 'Deactivate' : 'Reactivate'}
        </button>
      ) : (
        <span className="text-xs text-gray-400 italic">You</span>
      )
    )},
  ]

  return (
    <Layout title="User Management">
      {/* Info note explaining why there's no delete */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-sm text-blue-700">
        Users with existing transactions cannot be deleted — deactivate them instead.
        Deactivated users cannot log in but their history is preserved.
      </div>
      <DataTable columns={cols} data={users} loading={loading} />
    </Layout>
  )
}