import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState('login') // 'login' | 'forgot' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' })
  const [otpForm, setOtpForm] = useState({ email: '', otp: '', new_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const setOtp = (field) => (e) => setOtpForm({ ...otpForm, [field]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(form.email, form.password)
      router.push(userData.role === 'dispatcher' ? '/deliveries' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: otpForm.email })
      setTab('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', otpForm)
      setTab('login')
      setError('')
      alert('Password reset! Please log in.')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-2xl font-bold text-gray-900">Stockify</h1>
          <p className="text-gray-500 text-sm mt-1">Inventory Management System</p>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="admin@stockify.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required placeholder="••••••••" />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? (
                <svg className="animate-spin h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : 'Sign In'}
            </button>
            <div className="flex justify-between text-sm mt-2">
              <button type="button" onClick={() => { setTab('forgot'); setError('') }} className="text-primary-700 hover:underline">
                Forgot password?
              </button>
              <a href="/register" className="text-primary-700 hover:underline">Create account</a>
            </div>
          </form>
        )}

        {/* Forgot Password */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Reset Password</h2>
            <div>
              <label className="label">Your email</label>
              <input className="input" type="email" value={otpForm.email} onChange={setOtp('email')} required placeholder="you@example.com" />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => { setTab('login'); setError('') }} className="text-sm text-gray-500 hover:underline block mx-auto">
              ← Back to login
            </button>
          </form>
        )}

        {/* OTP + New Password */}
        {tab === 'otp' && (
          <form onSubmit={handleReset} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Enter OTP</h2>
            <p className="text-sm text-gray-500">Check the server console for your 6-digit OTP.</p>
            <div>
              <label className="label">OTP Code</label>
              <input className="input font-mono tracking-widest" type="text" value={otpForm.otp} onChange={setOtp('otp')} required placeholder="123456" maxLength={6} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" value={otpForm.new_password} onChange={setOtp('new_password')} required placeholder="••••••••" />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}