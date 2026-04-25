import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pg_token')
    const savedAdmin = localStorage.getItem('pg_admin')
    if (token && savedAdmin) {
      setAdmin(JSON.parse(savedAdmin))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { access_token, admin: adminData } = res.data
    localStorage.setItem('pg_token', access_token)
    localStorage.setItem('pg_admin', JSON.stringify(adminData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setAdmin(adminData)
    return adminData
  }

  const logout = () => {
    localStorage.removeItem('pg_token')
    localStorage.removeItem('pg_admin')
    delete axios.defaults.headers.common['Authorization']
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
