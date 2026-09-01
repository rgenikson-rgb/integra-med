'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  BedDouble,
  UserCog,
  Building2,
  ClipboardList,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    group: 'Principal',
    items: [
      { label: 'Dashboard',  href: '/',          icon: LayoutDashboard },
    ],
  },
  {
    group: 'Assistencial',
    items: [
      { label: 'Pacientes',  href: '/pacientes', icon: Users },
      { label: 'Leitos',     href: '/estrutura', icon: BedDouble },
    ],
  },
  {
    group: 'Administrativo',
    items: [
      { label: 'Usuários',    href: '/usuarios',     icon: UserCog },
      { label: 'Estrutura',   href: '/estrutura/configurar', icon: Building2 },
      { label: 'Auditoria',   href: '/auditoria',    icon: ClipboardList },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

interface SidebarProps {
  userName?: string
  userRole?: string
}

export function Sidebar({ userName = 'Usuário', userRole = '' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Placeholder logo */}
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-lg leading-none">IntegraMed</p>
            <p className="text-white/50 text-xs mt-0.5">Sistema Hospitalar</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map(group => (
          <div key={group.group} className="mb-6">
            <p className="text-white/40 text-xs font-display font-semibold uppercase tracking-widest px-3 mb-2">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        active
                          ? 'bg-white/15 text-white'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-white/40" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-accent/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-bold font-display">
              {userName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            {userRole && <p className="text-white/50 text-xs capitalize truncate">{userRole}</p>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
