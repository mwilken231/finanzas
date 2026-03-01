import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signup(form.email, form.password)
      } else {
        await login(form.email, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al autenticarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-2xl font-bold text-white">Finanzas Personales</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {isSignUp ? 'Crea una nueva cuenta' : 'Ingresá con tu cuenta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (isSignUp ? 'Creando cuenta...' : 'Ingresando...') : (isSignUp ? 'Crear cuenta' : 'Ingresar')}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="w-full text-sm text-slate-400 hover:text-slate-300 py-2"
          >
            {isSignUp ? '¿Ya tienes cuenta? Ingresá aquí' : '¿Sin cuenta? Registrate aquí'}
          </button>
        </form>
      </div>
    </div>
  )
}
