import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Search,
  Ticket,
  LogOut,
  UserRound,
  FileSearch,
  LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const navLink = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive
      ? 'bg-white/15 text-[#D6B875]'
      : 'text-gray-300 hover:bg-white/10 hover:text-[#D6B875]'
  }`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#1F2933] text-[#F8F5EF] shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold tracking-wide hover:text-[#D6B875] transition shrink-0"
        >
          <img
            src="/railbook-logo.png"
            alt="RailBook train logo"
            className="h-9 w-auto object-contain"
          />
          <span>RailBook</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">

          <NavLink to="/pnr" className={navLink}>
            <FileSearch size={17} />
            <span className="hidden sm:inline">PNR Status</span>
          </NavLink>

          {user ? (
            <>
              <NavLink to="/" end className={navLink}>
                <Search size={17} />
                <span className="hidden sm:inline">Search</span>
              </NavLink>

              <NavLink to="/my-bookings" className={navLink}>
                <Ticket size={17} />
                <span className="hidden sm:inline">My Bookings</span>
              </NavLink>

              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={navLink}>
                  <LayoutDashboard size={17} />
                  <span className="hidden sm:inline">Admin</span>
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className="hidden lg:flex items-center gap-2 px-2 text-sm text-gray-300 hover:text-[#D6B875] transition"
              >
                <UserRound size={16} />
                {user.name}
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#D6B875] text-[#1F2933] px-3 sm:px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#E4CB91] transition ml-1"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLink}>
                Login
              </NavLink>

              <Link
                to="/register"
                className="bg-[#D6B875] text-[#1F2933] px-3 sm:px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#E4CB91] transition ml-1"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}