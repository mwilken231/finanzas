import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data)

export const getMe = () => api.get('/auth/me').then((r) => r.data)

export const changePassword = (old_password, new_password) =>
  api.put('/auth/change-password', { old_password, new_password }).then((r) => r.data)

export const getApiKey = () => api.get('/auth/api-key').then((r) => r.data)

export const regenerateApiKey = () =>
  api.post('/auth/api-key/regenerate').then((r) => r.data)

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = (tipo) =>
  api.get('/categories', { params: tipo ? { tipo } : {} }).then((r) => r.data)

export const createCategory = (data) =>
  api.post('/categories', data).then((r) => r.data)

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then((r) => r.data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then((r) => r.data)

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions = (params) =>
  api.get('/transactions', { params }).then((r) => r.data)

export const getTransaction = (id) =>
  api.get(`/transactions/${id}`).then((r) => r.data)

export const createTransaction = (data) =>
  api.post('/transactions', data).then((r) => r.data)

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then((r) => r.data)

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = (mes) =>
  api.get('/dashboard/summary', { params: { mes } }).then((r) => r.data)

export const getDashboardChart = (months = 6) =>
  api.get('/dashboard/chart', { params: { months } }).then((r) => r.data)

// ── Plans ─────────────────────────────────────────────────────────────────────
export const getPlans = (mes, tipo) =>
  api.get('/plans', { params: { mes, ...(tipo ? { tipo } : {}) } }).then((r) => r.data)

export const createPlan = (data) =>
  api.post('/plans', data).then((r) => r.data)

export const updatePlan = (id, data) =>
  api.put(`/plans/${id}`, data).then((r) => r.data)

export const deletePlan = (id) =>
  api.delete(`/plans/${id}`).then((r) => r.data)

export const copyPlan = (from_mes, to_mes) =>
  api.post(`/plans/copy/${from_mes}`, null, { params: { to_mes } }).then((r) => r.data)

// ── Credit Cards ──────────────────────────────────────────────────────────────
export const getCards = (activo = true) =>
  api.get('/cards', { params: { activo } }).then((r) => r.data)

export const createCard = (data) =>
  api.post('/cards', data).then((r) => r.data)

export const updateCard = (id, data) =>
  api.put(`/cards/${id}`, data).then((r) => r.data)

export const advanceCard = (id) =>
  api.post(`/cards/${id}/advance`).then((r) => r.data)

export const deleteCard = (id) =>
  api.delete(`/cards/${id}`).then((r) => r.data)

// ── Backup ────────────────────────────────────────────────────────────────────
export const downloadBackupJson = () => {
  window.open('/backup/json', '_blank')
}
export const downloadBackupCsv = () => {
  window.open('/backup/csv', '_blank')
}

export default api
