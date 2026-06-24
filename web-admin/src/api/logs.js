import api from './axios'

export const getActivityLogs = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.action) params.append('action', filters.action)
  const res = await api.get(`/logs/activities?${params.toString()}`)
  return res.data
}

export const getNotifications = async (onlyUnread = false) => {
  const res = await api.get(`/logs/notifications${onlyUnread ? '?unread=true' : ''}`)
  return res.data
}

export const markNotificationRead = async (id) => {
  const res = await api.put(`/logs/notifications/${id}/read`)
  return res.data
}

export const markAllNotificationsRead = async () => {
  const res = await api.put('/logs/notifications/read-all')
  return res.data
}
