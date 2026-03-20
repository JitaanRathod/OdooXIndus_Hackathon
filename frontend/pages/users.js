import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../lib/api'
import toast from 'react-hot-toast'

const ROLES = ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher']

const ROLE_META = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  inventory_manager: { label: 'Inv. Manager', color: 'bg-blue-100   text-blue-700' },
  warehouse_staff: { label: 'WH Staff', color: 'bg-green-100  text-green-700' },
  dispatcher: { label: 'Dispatcher', color: 'bg-amber-100  text-amber-700' },
}

const AVATAR_COLORS = ['bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-emerald-500', 'bg-rose-500', 'bg-orange-500']
function avatarColor(name = '') {
  let h = 0; for (const c of name) h = (h << 5) - h + c.charCodeAt(0)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function Users() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user && user.role !== 'admin') router.push('/dashboard')
  }, [user, authLoading])

  const load = () => {
    setLoading(true)
    api.get('/users')
      .then(({ data }) => setUsers(data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (user) load() }, [user])

  const handleRoleChange = async (u, role) => {
    try {
      await api.put(`/users/${u.id}`, { role })
      toast.success(`Role updated to ${ROLE_META[role]?.label || role}`)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role') }
  }

  const handleToggleActive = (u) => {
    const action = u.is_active ? 'deactivate' : 'reactivate'
    setConfirm({
      title: `${u.is_active ? 'Deactivate' : 'Reactivate'} "${u.name}"?`,
      message: u.is_active
        ? 'This user will not be able to log in. Their history is preserved.'
        : 'This user will be able to log in again.',
      confirmLabel: u.is_active ? 'Deactivate' : 'Reactivate',
      danger: u.is_active,
      onConfirm: async () => {
        try {
          await api.put(`/users/${u.id}`, { is_active: !u.is_active })
          toast.success(`User ${u.is_active ? 'deactivated' : 'reactivated'}`)
          load()
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update user') }
      },
    })
  }

  const cols = [
    {
      key: 'name', label: 'User', render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarColor(v)}`}>
            {v?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{v}</p>
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role', label: 'Role', render: (v, row) => (
        row.id === user?.id
          ? <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_META[v]?.color || 'bg-gray-100 text-gray-700'}`}>{ROLE_META[v]?.label || v}</span>
          : (
            <select
              value={v}
              onChange={(e) => handleRoleChange(row, e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors hover:border-gray-300"
            >
              {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label || r}</option>)}
            </select>
          )
      )
    },
    {
      key: 'is_active', label: 'Status', render: (v) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-green-500' : 'bg-red-500'}`} />
          {v ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => (
        row.id !== user?.id
          ? (
            <button
              onClick={() => handleToggleActive(row)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${row.is_active
                  ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
                  : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
                }`}
            >
              {row.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
          )
          : <span className="text-xs text-gray-400 italic px-2">You</span>
      )
    },
  ]

  return (
    <Layout title="User Management">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700 flex items-start gap-2">
        <span className="text-base mt-0.5">ℹ️</span>
        <span>Users with existing transactions cannot be deleted — deactivate them instead. Deactivated users cannot log in but their history is preserved.</span>
      </div>
      <DataTable columns={cols} data={users} loading={loading} />
      <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />
    </Layout>
  )
}