import React, { createContext, useContext, useState, useCallback } from 'react'

// ---- Types ----
interface User {
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// ---- Hardcoded credentials ----
const VALID_EMAIL    = 'admin@shop.com'
const VALID_PASSWORD = 'password123'
const VALID_USER: User = { email: VALID_EMAIL, name: 'Admin' }

// ---- Context ----
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('auth_user')
      return stored ? (JSON.parse(stored) as User) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email: string, password: string) => {
    // Simulate a short async round-trip
    await new Promise<void>((resolve) => setTimeout(resolve, 400))

    if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
      setUser(VALID_USER)
      sessionStorage.setItem('auth_user', JSON.stringify(VALID_USER))
    } else {
      throw new Error('Invalid email or password.')
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('auth_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
