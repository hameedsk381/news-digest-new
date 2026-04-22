import { NavLink } from 'react-router-dom'
import { Newspaper, BarChart3, Cloud } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: Newspaper },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <Cloud size={18} className="text-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[15px] font-bold tracking-tight text-white leading-none">
                Intelligence
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-mono mt-0.5">
                Nexus OS
              </span>
            </div>
          </NavLink>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
