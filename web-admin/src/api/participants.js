import api from './axios'

export const getParticipants = async () => {
  const res = await api.get('/participants')
  return res.data
}

export const getParticipant = async (id) => {
  const res = await api.get(`/participants/${id}`)
  return res.data
}

export const registerParticipant = async (data) => {
  const res = await api.post('/participants', data)
  return res.data
}

export const deleteParticipant = async (id) => {
  const res = await api.delete(`/participants/${id}`)
  return res.data
}
