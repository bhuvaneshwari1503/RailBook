import { useState } from 'react'
import { AuthContext } from './AuthContext'
import api from '../api/axios'



export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const saveSession = (data) => {
    localStorage.setItem('token', data.token)

    const u = {
      name: data.name,
      email: data.email,
      role: data.role
    }

    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    saveSession(res.data)
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    saveSession(res.data)
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
