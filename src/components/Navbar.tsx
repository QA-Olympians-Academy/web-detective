import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        web-detective
      </div>

      <div className="navbar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Products
        </NavLink>
      </div>

      <div className="navbar-right">
        {user && (
          <span className="navbar-user">{user.email}</span>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
