import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login')
    }
  }, [user, loading])

  return <LoadingSpinner center />
}