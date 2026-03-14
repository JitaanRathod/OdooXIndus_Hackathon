import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()

  const [tab, setTab]       = useState('login') // 'login' | 'forgot' | 'otp'
  const [form, setForm]     = useState({ email: '', password: '' })
  const [otpEmail, setOtpEmail] = useState('')
  const [otpForm, setOtpForm]   = useState({ otp: '', new_password: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set    = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const setOtp = (field) => (e) => setOtpForm({ ...otpForm, [field]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const userData = await login(form.email, form.password)
      router.push(userData.role === 'dispatcher' ? '/deliveries' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: otpEmail })
      setSuccess('OTP generated! Check the backend server terminal/console for your 6-digit code.')
      setTab('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: otpEmail, otp: otpForm.otp, new_password: otpForm.new_password,
      })
      setSuccess('Password reset successfully!')
      setTab('login')
      setOtpForm({ otp: '', new_password: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">📦</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Stockify</h1>
          <p className="text-sm text-gray-500">Inventory Management System</p>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <button type="button" onClick={() => { setTab('forgot'); setError(''); setSuccess('') }}
                className="hover:text-primary-700 hover:underline">
                Forgot password?
              </button>
              <a href="/register" className="hover:text-primary-700 hover:underline">Create account</a>
            </div>
          </form>
        )}

        {/* Forgot password — enter email */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h2>
              <p className="text-sm text-gray-500">Enter your email to receive a one-time password.</p>
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)} required autoFocus />
            </div>
            {error   && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
            <button type="button" onClick={() => { setTab('login'); setError(''); setSuccess('') }}
              className="w-full text-center text-sm text-gray-500 hover:text-primary-700">
              ← Back to Login
            </button>
          </form>
        )}

        {/* OTP verification — FIX screenshot issue 3: clear instructions */}
        {tab === 'otp' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Enter OTP</h2>
              {/* FIX: Clear instruction about where to find OTP */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                <p className="font-medium">Where is my OTP?</p>
                <p className="mt-0.5 text-xs">Check the <strong>backend server terminal</strong> (the CMD/PowerShell window where you ran <code className="bg-blue-100 px-1 rounded">npm run dev</code>). The 6-digit code is printed there.</p>
              </div>
            </div>
            <div>
              <label className="label">OTP Code</label>
              <input className="input font-mono tracking-widest text-center text-lg" type="text"
                maxLength={6} value={otpForm.otp} onChange={setOtp('otp')}
                placeholder="123456" required autoFocus />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" value={otpForm.new_password}
                onChange={setOtp('new_password')} minLength={6} required />
            </div>
            {error   && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-green-700 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => { setTab('forgot'); setError('') }}
              className="w-full text-center text-sm text-gray-500 hover:text-primary-700">
              ← Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  )
}