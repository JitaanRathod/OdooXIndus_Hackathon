import { useState } from 'react'
import { useRouter } from 'next/router'
import api from '../lib/api'

const ROLES = [
  { value: 'admin',             label: 'Admin' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'warehouse_staff',   label: 'Warehouse Staff' },
  { value: 'dispatcher',        label: 'Dispatcher' },
]

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'warehouse_staff' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Backend returns: { success: true, message: 'Account created successfully', data: { token, user } }
      const { data } = await api.post('/auth/register', form)
      // Store token and redirect directly if we want auto-login, otherwise go to login page
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        router.push(data.data.user.role === 'dispatcher' ? '/deliveries' : '/dashboard')
      } else {
        router.push('/login')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the Stockify team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" type="text" value={form.name} onChange={set('name')} required placeholder="John Smith" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="you@stockify.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" minLength={6} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? 'Creating account...' : 'Register'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-primary-700 hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  )
}