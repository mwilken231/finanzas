import { useState, useEffect } from 'react'
import { supabase } from './supabase'

/**
 * Fetch categories for the current user
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error, refetch: fetchCategories }
}

/**
 * Fetch transactions for the current user
 */
export const useTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      let query = supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)

      if (filters.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate)
      }
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { transactions, loading, error, refetch: fetchTransactions }
}

/**
 * Fetch monthly plans for the current user
 */
export const useMonthlyPlans = (month) => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPlans()
  }, [month])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      let query = supabase
        .from('monthly_plans')
        .select('*, categories(name)')
        .eq('user_id', user.id)

      if (month) {
        query = query.eq('month', month)
      }

      const { data, error } = await query.order('created_at')

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { plans, loading, error, refetch: fetchPlans }
}

/**
 * Fetch credit cards for the current user
 */
export const useCreditCards = () => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error
      setCards(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { cards, loading, error, refetch: fetchCards }
}

/**
 * Add a new transaction
 */
export const addTransaction = async (transaction) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        ...transaction,
        user_id: user.id,
      },
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Update a transaction
 */
export const updateTransaction = async (id, updates) => {
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a transaction
 */
export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Add a new category
 */
export const addCategory = async (category) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        ...category,
        user_id: user.id,
      },
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Update a category
 */
export const updateCategory = async (id, updates) => {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a category
 */
export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Add a new monthly plan
 */
export const addMonthlyPlan = async (plan) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('monthly_plans')
    .insert([
      {
        ...plan,
        user_id: user.id,
      },
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Update a monthly plan
 */
export const updateMonthlyPlan = async (id, updates) => {
  const { error } = await supabase
    .from('monthly_plans')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a monthly plan
 */
export const deleteMonthlyPlan = async (id) => {
  const { error } = await supabase
    .from('monthly_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Add a new credit card
 */
export const addCreditCard = async (card) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('credit_cards')
    .insert([
      {
        ...card,
        user_id: user.id,
      },
    ])
    .select()

  if (error) throw error
  return data?.[0]
}

/**
 * Update a credit card
 */
export const updateCreditCard = async (id, updates) => {
  const { error } = await supabase
    .from('credit_cards')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

/**
 * Delete a credit card
 */
export const deleteCreditCard = async (id) => {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id)

  if (error) throw error
}
