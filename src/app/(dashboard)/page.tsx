import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Users, BedDouble, Activity, TrendingUp } from 'lucide-react'

async function getDashboardStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [patients, beds, bedsOccupied] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('beds').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('beds').select('id', { count: 'exact', head: true }).eq('status', 'occupied'),
  ])

  const totalBeds = beds.count ?? 0
  const occupied = bedsOccupied.count ?? 0
  const available = totalBeds - occupied
  const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0

  return {
    totalPatients: patients.count ?? 0,
    totalBeds,
    available,
    occupied,
    occupancyRate,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const stats = await getDashboardStats(supabase)

  const cards = [
    {
      label: 'Pacientes cadastrados',
      value: stats.totalPatients.toLocaleString('pt-BR'),
      icon: Users,
      color: 'text-primary bg-primary-50',
      border: 'border-l-4 border-primary',
    },
    {
      label: 'Leitos disponíveis',
      value: stats.available.toLocaleString('pt-BR'),
      icon: BedDouble,
      color: 'text-accent bg-accent/10',
      border: 'border-l-4 border-accent',
    },
    {
      label: 'Leitos ocupados',
      value: stats.occupied.toLocaleString('pt-BR'),
      icon: Activity,
      color: 'text-red-600 bg-red-50',
      border: 'border-l-4 border-red-400',
    },
    {
      label: 'Taxa de ocupação',
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: 'text-secondary bg-secondary/10',
      border: 'border-l-4 border-secondary',
    },
  ]

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Visão geral do hospital"
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} className={`card ${card.border} flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Boas-vindas se sem dados */}
        {stats.totalPatients === 0 && (
          <div className="card text-center py-12 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display font-bold text-gray-800 text-xl mb-2">
              Sistema configurado e pronto
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Comece cadastrando a estrutura do hospital (unidades, quartos, leitos)
              e os primeiros pacientes.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/estrutura" className="btn-primary text-sm">
                Configurar estrutura
              </a>
              <a href="/pacientes/novo" className="btn-secondary text-sm">
                Cadastrar paciente
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
