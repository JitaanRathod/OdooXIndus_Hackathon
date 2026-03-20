import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { TrendingUp, Eye, EyeOff, Loader2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Head from 'next/head'

// ── Demo role accounts ──────────────────────────────────────────────────────
const DEMO_ROLES = [
  { role: 'Admin', email: 'admin@stockify.com', password: 'stockify123', color: 'from-violet-600 to-indigo-600', ring: 'ring-violet-400', icon: '👑' },
  { role: 'Inventory Manager', email: 'manager@stockify.com', password: 'stockify123', color: 'from-blue-600 to-cyan-500', ring: 'ring-blue-400', icon: '📦' },
  { role: 'Warehouse Staff', email: 'staff@stockify.com', password: 'stockify123', color: 'from-emerald-600 to-teal-500', ring: 'ring-emerald-400', icon: '🏭' },
  { role: 'Dispatcher', email: 'dispatcher@stockify.com', password: 'stockify123', color: 'from-orange-500 to-amber-500', ring: 'ring-orange-400', icon: '🚚' },
]

// ── Animated cursor-following gradient blobs ────────────────────────────────
function AnimatedBackground() {
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX / window.innerWidth)
      mouseY.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    const unsubX = springX.on('change', v => setPos(p => ({ ...p, x: v })))
    const unsubY = springY.on('change', v => setPos(p => ({ ...p, y: v })))
    return () => { unsubX(); unsubY() }
  }, [springX, springY])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Dark base */}
      <div className="absolute inset-0 bg-[#0d0d1a]" />

      {/* Cursor-following primary blob */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-3xl pointer-events-none transition-none"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, #8b5cf6 40%, transparent 70%)',
          left: `${pos.x * 100}%`,
          top: `${pos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Secondary blob — offset, inverted position */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #0ea5e9 0%, #06b6d4 50%, transparent 70%)',
          left: `${(1 - pos.x) * 100}%`,
          top: `${(1 - pos.y) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Tertiary accent — diagonal */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, #f43f5e 50%, transparent 70%)',
          left: `${pos.y * 60 + 20}%`,
          top: `${pos.x * 60 + 20}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating orbs */}
      {[
        { w: 6, h: 6, color: '#818cf8', top: '15%', left: '10%', dur: 4 },
        { w: 4, h: 4, color: '#34d399', top: '70%', left: '20%', dur: 6 },
        { w: 5, h: 5, color: '#f472b6', top: '30%', left: '85%', dur: 5 },
        { w: 3, h: 3, color: '#60a5fa', top: '80%', left: '75%', dur: 7 },
        { w: 4, h: 4, color: '#a78bfa', top: '55%', left: '50%', dur: 4.5 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: dot.w, height: dot.h, background: dot.color, top: dot.top, left: dot.left }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: dot.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
        />
      ))}

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }}
      />
    </div>
  )
}

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpForm, setOtpForm] = useState({ otp: '', new_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState(null)

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const setOtp = (f) => (e) => setOtpForm({ ...otpForm, [f]: e.target.value })

  const doLogin = async (email, password) => {
    setError('')
    const userData = await login(email, password)
    toast.success(`Welcome, ${userData.name}!`, { icon: '👋' })
    router.push(userData.role === 'dispatcher' ? '/deliveries' : '/dashboard')
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await doLogin(form.email, form.password) }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password') }
    finally { setLoading(false) }
  }

  const handleRoleLogin = async (role) => {
    setQuickLoading(role.role); setError('')
    try { await doLogin(role.email, role.password) }
    catch (err) { setError(err.response?.data?.message || `Could not log in as ${role.role}`) }
    finally { setQuickLoading(null) }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: otpEmail })
      setTab('otp')
      toast.success('OTP sent — check the backend terminal.')
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleReset = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/auth/reset-password', { email: otpEmail, otp: otpForm.otp, new_password: otpForm.new_password })
      toast.success('Password reset! Please login.')
      setTab('login'); setOtpForm({ otp: '', new_password: '' })
    } catch (err) { setError(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head>
        <title>Sign In — Stockify</title>
      </Head>

      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatedBackground />

        {/* Center container */}
        <div className="relative z-10 w-full max-w-md px-4">

          {/* Logo / brand */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-900/40 mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Stockify</h1>
            <p className="text-white/50 text-sm mt-1">Inventory Management System</p>
          </motion.div>

          {/* Main card */}
          <motion.div
            className="relative bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Gradient top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400" />

            <div className="px-8 py-8">

              {/* ── LOGIN TAB ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white">Welcome back</h2>
                    <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                      {error}
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email" required autoFocus
                      value={form.email} onChange={set('email')}
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      placeholder="you@stockify.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'} required
                        value={form.password} onChange={set('password')}
                        className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-violet-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>

                  <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                    <button type="button" onClick={() => { setTab('forgot'); setError('') }}
                      className="hover:text-white transition-colors">Forgot password?</button>
                    <button type="button" onClick={() => router.push('/register')}
                      className="hover:text-white transition-colors">Create account</button>
                  </div>

                  {/* ── Quick role login ── */}
                  <div className="pt-3">
                    <p className="text-center text-xs text-white/40 mb-3 flex items-center gap-2">
                      <span className="flex-1 h-px bg-white/10" />
                      Quick Access (Demo)
                      <span className="flex-1 h-px bg-white/10" />
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_ROLES.map((role) => (
                        <motion.button
                          key={role.role}
                          type="button"
                          onClick={() => handleRoleLogin(role)}
                          disabled={!!quickLoading}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-gradient-to-br ${role.color} text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 hover:shadow-lg ring-1 ring-white/10`}
                        >
                          {quickLoading === role.role
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <span className="text-base leading-none">{role.icon}</span>
                          }
                          <span className="leading-tight">{role.role}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* ── FORGOT PASSWORD TAB ── */}
              {tab === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white">Reset Password</h2>
                    <p className="text-white/50 text-sm mt-1">Enter your email to receive an OTP</p>
                  </div>
                  {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" required value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} autoFocus
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:scale-[1.02] transition-all">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send OTP
                  </button>
                  <button type="button" onClick={() => { setTab('login'); setError('') }} className="w-full text-white/40 hover:text-white text-sm transition-colors text-center">← Back to Sign In</button>
                </form>
              )}

              {/* ── OTP RESET TAB ── */}
              {tab === 'otp' && (
                <form onSubmit={handleReset} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white">Enter OTP</h2>
                    <p className="text-white/50 text-sm mt-1">Check the backend terminal for your OTP</p>
                  </div>
                  {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</div>}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">OTP Code</label>
                    <input value={otpForm.otp} onChange={setOtp('otp')} required placeholder="000000" autoFocus
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">New Password</label>
                    <input type="password" value={otpForm.new_password} onChange={setOtp('new_password')} required
                      className="w-full bg-white/10 border border-white/15 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 hover:scale-[1.02] transition-all">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />} Reset Password
                  </button>
                  <button type="button" onClick={() => { setTab('login'); setError('') }} className="w-full text-white/40 hover:text-white text-sm transition-colors text-center">← Back to Sign In</button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-center text-white/25 text-xs mt-6">Stockify © 2025 · Inventory Management System</p>
        </div>
      </div>
    </>
  )
}