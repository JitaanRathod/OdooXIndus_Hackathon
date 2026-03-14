import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser  = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // Verify token is still valid
      // Backend returns: { success: true, data: { user: {...} } }
      api.get('/auth/me')
        .then(({ data }) => {
          const freshUser = data.data.user   // correct path per backend
          setUser(freshUser)
          localStorage.setItem('user', JSON.stringify(freshUser))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { token: jwt, user: userData } = data.data
    localStorage.setItem('token', jwt)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}