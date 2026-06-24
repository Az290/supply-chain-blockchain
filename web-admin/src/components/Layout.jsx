import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/admin', label: 'Tổng quan', icon: '▣', end: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: '◫' },
  { to: '/admin/participants', label: 'Thành viên', icon: '◑' },
  { to: '/admin/logs', label: 'Activity Logs', icon: '≡' },
  { to: '/admin/notifications', label: 'Thông báo', icon: '◎' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-200">
          <h1 className="text-base font-semibold text-gray-800">Supply Chain</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700">{user?.name || user?.id}</p>
          <p className="text-xs text-gray-400 mb-3">{user?.id} · Admin</p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded border border-red-200 transition-colors"
          >
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )

}
