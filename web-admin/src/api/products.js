import api from './axios'
 
export const getProducts = async () => {
  const res = await api.get('/products')
  return res.data
}
 
export const getProduct = async (id) => {
  const res = await api.get(`/products/${id}`)
  return res.data
}
 
export const getStatistics = async () => {
  const res = await api.get('/products/statistics')
  return res.data
}
export const updateProductStatus = async (id, data) => {
  const res = await api.put(`/products/${id}/status`, data)
  return res.data
}
 
export const transferOwnership = async (id, newOwner) => {
  const res = await api.put(`/products/${id}/transfer`, { newOwner })
  return res.data
}
 
export const getProductHistory = async (id) => {
  const res = await api.get(`/products/${id}/history`)
  return res.data
}
