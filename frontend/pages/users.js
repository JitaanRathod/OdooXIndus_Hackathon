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
    api.get('/users').then(({ data }) => setUsers(data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleRoleChange = async (u, role) => {
    try { await api.put(`/users/${u.id}`, { role }); load() }
    catch (err) { alert(err.response?.data?.message || 'Failed to update role') }
  }

  const handleToggleActive = async (u) => {
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); load() }
    catch (err) { alert(err.response?.data?.message || 'Failed to update user') }
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return
    try { await api.delete(`/users/${u.id}`); load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
  }

  const cols = [
    { key: 'name',      label: 'Name',   render: (v, row) => (
      <div>
        <p className="font-medium text-gray-900">{v}</p>
        <p className="text-xs text-gray-400">{row.email}</p>
      </div>
    )},
    { key: 'role',      label: 'Role',   render: (v, row) => (
      <select
        value={v}
        disabled={row.id === user?.id}
        onChange={(e) => handleRoleChange(row, e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50"
      >
        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
    )},
    { key: 'is_active', label: 'Status', render: (v, row) => (
      <button
        disabled={row.id === user?.id}
        onClick={() => handleToggleActive(row)}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50
          ${v ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
      >
        {v ? 'Active' : 'Inactive'}
      </button>
    )},
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'actions',   label: '',       render: (_, row) => (
      row.id !== user?.id && (
        <button onClick={() => handleDelete(row)} className="text-xs text-red-500 hover:underline">Delete</button>
      )
    )},
  ]

  return (
    <Layout title="User Management">
      <DataTable columns={cols} data={users} loading={loading} />
    </Layout>
  )
}