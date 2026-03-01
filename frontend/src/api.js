import { supabase } from './lib/supabase'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) => 
  supabase.auth.signInWithPassword({ email, password }).then(r => {
    if (r.error) throw r.error
    return r.data.user
  })

export const getMe = () => 
  supabase.auth.getUser().then(r => {
    if (r.error) throw r.error
    return r.data.user
  })

export const changePassword = (old_password, new_password) =>
  supabase.auth.updateUser({ password: new_password }).then(r => {
    if (r.error) throw r.error
    return r.data.user
  })

// Legacy API key methods (not supported in Supabase)
export const getApiKey = () => Promise.resolve({ api_key: 'n/a' })
export const regenerateApiKey = () => Promise.resolve({ api_key: 'n/a' })

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = async (tipo) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)

  if (tipo) {
    query = query.eq('type', tipo)
  }

  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}

export const createCategory = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data: result, error } = await supabase
    .from('categories')
    .insert([{ ...data, user_id: user.id }])
    .select()

  if (error) throw error
  return result?.[0]
}

export const updateCategory = async (id, data) => {
  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)

  if (error) throw error
}

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions = async (params = {}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  let query = supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', user.id)

  if (params.startDate) query = query.gte('date', params.startDate)
  if (params.endDate) query = query.lte('date', params.endDate)
  if (params.type) query = query.eq('type', params.type)
  if (params.categoryId) query = query.eq('category_id', params.categoryId)

  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data
}

export const getTransaction = async (id) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createTransaction = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data: result, error } = await supabase
    .from('transactions')
    .insert([{ ...data, user_id: user.id }])
    .select()

  if (error) throw error
  return result?.[0]
}

export const updateTransaction = async (id, data) => {
  const { error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)

  if (error) throw error
}

export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = async (mes) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const year = new Date(mes).getFullYear()
  const month = new Date(mes).getMonth() + 1
  const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  if (error) throw error

  const ingresos = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  const gastos = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  return {
    ingresos,
    gastos,
    saldo: ingresos - gastos,
    mes,
  }
}

export const getDashboardChart = async (months = 6) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setMonth(startDate.getMonth() - months)

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])

  if (error) throw error

  // Group by month
  const grouped = {}
  transactions.forEach(t => {
    const monthKey = t.date.substring(0, 7) // YYYY-MM
    if (!grouped[monthKey]) grouped[monthKey] = { income: 0, expense: 0 }
    if (t.type === 'income') {
      grouped[monthKey].income += parseFloat(t.amount)
    } else {
      grouped[monthKey].expense += parseFloat(t.amount)
    }
  })

  return Object.entries(grouped)
    .sort()
    .map(([month, data]) => ({
      month,
      ...data,
    }))
}

// ── Plans ─────────────────────────────────────────────────────────────────────
export const getPlans = async (mes, tipo) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  let query = supabase
    .from('monthly_plans')
    .select('*, categories(name)')
    .eq('user_id', user.id)

  if (mes) {
    const monthStart = new Date(mes).toISOString().split('T')[0]
    query = query.eq('month', monthStart)
  }

  const { data, error } = await query.order('created_at')
  if (error) throw error
  return data
}

export const createPlan = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data: result, error } = await supabase
    .from('monthly_plans')
    .insert([{ ...data, user_id: user.id }])
    .select()

  if (error) throw error
  return result?.[0]
}

export const updatePlan = async (id, data) => {
  const { error } = await supabase
    .from('monthly_plans')
    .update(data)
    .eq('id', id)

  if (error) throw error
}

export const deletePlan = async (id) => {
  const { error } = await supabase
    .from('monthly_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const copyPlan = async (from_mes, to_mes) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  // Get plans from source month
  const { data: sourcePlans, error: fetchError } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', from_mes)

  if (fetchError) throw fetchError

  // Create new plans for target month
  const newPlans = sourcePlans.map(p => ({
    ...p,
    id: undefined, // Let DB generate new ID
    month: to_mes,
  }))

  const { data, error } = await supabase
    .from('monthly_plans')
    .insert(newPlans)
    .select()

  if (error) throw error
  return data
}

// ── Credit Cards ──────────────────────────────────────────────────────────────
export const getCards = async (activo = true) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data
}

export const createCard = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data: result, error } = await supabase
    .from('credit_cards')
    .insert([{ ...data, user_id: user.id }])
    .select()

  if (error) throw error
  return result?.[0]
}

export const updateCard = async (id, data) => {
  const { error } = await supabase
    .from('credit_cards')
    .update(data)
    .eq('id', id)

  if (error) throw error
}

export const advanceCard = async (id) => {
  // Placeholder for card advance functionality
  // This would need to be implemented based on your specific logic
  return { success: true }
}

export const deleteCard = async (id) => {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ── Backup ────────────────────────────────────────────────────────────────────
export const downloadBackupJson = () => {
  // Implement backup functionality if needed
  console.log('Backup feature needs to be implemented')
}

export const downloadBackupCsv = () => {
  // Implement backup functionality if needed
  console.log('Backup feature needs to be implemented')
}

export default { getTransactions, getMe, login }
