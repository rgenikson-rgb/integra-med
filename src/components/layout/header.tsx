import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-bold text-gray-900 text-lg leading-none">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-surface rounded-lg px-3 py-2 w-64 border border-gray-100">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-surface transition-colors text-gray-500 hover:text-primary">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
      </button>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
