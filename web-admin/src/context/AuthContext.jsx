import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      getMe()
        .then((res) => {
          if (res.success) {
            if (res.data.role !== 'ADMIN') {
              localStorage.clear()
              setUser(null)
            } else {
              setUser(res.data)
            }
          }
        })
        .catch(() => {
          localStorage.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (id, password) => {
    const res = await apiLogin(id, password)
    if (!res.success) throw new Error(res.message || 'Đăng nhập thất bại')
    if (res.data.user.role !== 'ADMIN') throw new Error('Tài khoản không có quyền Admin')
    localStorage.setItem('accessToken', res.data.accessToken)
    localStorage.setItem('refreshToken', res.data.refreshToken)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {}
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider')
  return ctx
}
