import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Shield, Users, Mail, BarChart3, FileText,
  Settings, ChevronLeft, ChevronRight, LogOut, Bell, Search,
  Target, Zap, BookOpen, Menu, X
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Target, label: 'Campaigns' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/templates', icon: Mail, label: 'Templates' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static z-50 h-full flex flex-col bg-gray-950 border-r border-gray-800/60
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-gray-800/60">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-gray-950" />
              </div>
              <span className="font-bold text-gray-100 tracking-tight">PhishGuard</span>
            </div>
          )}
          {collapsed && <div className="w-7 h-7 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto"><Shield className="w-4 h-4 text-gray-950" /></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            } title={collapsed ? label : undefined}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Admin info */}
        <div className="p-2 border-t border-gray-800/60">
          {!collapsed ? (
            <div className="flex items-center gap-2 p-2 rounded-lg">
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {admin?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{admin?.username}</p>
                <p className="text-xs text-gray-500 truncate">{admin?.role?.replace('_', ' ')}</p>
              </div>
              <button onClick={() => { logout(); navigate('/login') }} className="p-1 hover:text-red-400 text-gray-500 transition-colors" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => { logout(); navigate('/login') }} className="w-full flex justify-center p-2 hover:text-red-400 text-gray-500" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-gray-950 border-b border-gray-800/60 flex items-center gap-3 px-4 flex-shrink-0">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1.5 rounded-md hover:bg-gray-800 text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-slow" />
            <span className="text-xs text-gray-500 font-mono hidden sm:block">MOCK MODE</span>
          </div>
          <div className="w-px h-5 bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-gray-200">{admin?.username}</p>
              <p className="text-xs text-cyan-400 capitalize">{admin?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <div className="p-5 lg:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
