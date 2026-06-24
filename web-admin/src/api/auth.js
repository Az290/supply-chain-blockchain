import api from './axios'

export const login = async (id, password) => {
  const res = await api.post('/auth/login', { id, password })
  return res.data
}

export const logout = async () => {
  const res = await api.post('/auth/logout')
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}
