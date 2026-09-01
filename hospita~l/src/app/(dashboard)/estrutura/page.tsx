import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Bed } from '@/types/database'

const statusConfig: Record<Bed['status'], { label: string; color: string; dot: string }> = {
  available:   { label: 'Disponível',  color: 'bg-accent/10 text-accent border border-accent/30',       dot: 'bg-accent' },
  occupied:    { label: 'Ocupado',     color: 'bg-red-50 text-red-700 border border-red-200',            dot: 'bg-red-500' },
  cleaning:    { label: 'Limpeza',     color: 'bg-yellow-50 text-yellow-700 border border-yellow-200',   dot: 'bg-yellow-400' },
  maintenance: { label: 'Manutenção',  color: 'bg-gray-100 text-gray-600 border border-gray-200',        dot: 'bg-gray-400' },
  reserved:    { label: 'Reservado',   color: 'bg-primary-50 text-primary border border-primary/20',     dot: 'bg-primary' },
  blocked:     { label: 'Bloqueado',   color: 'bg-gray-800/10 text-gray-700 border border-gray-300',     dot: 'bg-gray-700' },
}

type BedWithRoom = Bed & {
  rooms: {
    number: string
    sectors: {
      name: string
      units: {
        id: string
        name: string
      }
    }
  }
}

export default async function EstruturaBedMapPage() {
  const supabase = await createClient()

  // Buscar todas as unidades
  const { data: units } = await supabase
    .from('units')
    .select('id, name, type, floor')
    .eq('is_active', true)
    .order('name')

  // Buscar todos os leitos com sua hierarquia
  const { data: beds } = await supabase
    .from('beds')
    .select(`
      *,
      rooms (
        number,
        sectors (
          name,
          units ( id, name )
        )
      )
    `)
    .eq('is_active', true)
    .order('code')

  const bedList = (beds as BedWithRoom[]) ?? []

  // Agrupar leitos por unidade
  const bedsByUnit: Record<string, BedWithRoom[]> = {}
  bedList.forEach(bed => {
    const unitId = bed.rooms?.sectors?.units?.id
    if (unitId) {
      if (!bedsByUnit[unitId]) bedsByUnit[unitId] = []
      bedsByUnit[unitId].push(bed)
    }
  })

  // Contadores gerais
  const counts = {
    available:   bedList.filter(b => b.status === 'available').length,
    occupied:    bedList.filter(b => b.status === 'occupied').length,
    cleaning:    bedList.filter(b => b.status === 'cleaning').length,
    maintenance: bedList.filter(b => b.status === 'maintenance').length,
    reserved:    bedList.filter(b => b.status === 'reserved').length,
    total:       bedList.length,
  }

  return (
    <>
      <Header
        title="Mapa de Leitos"
        subtitle="Situação em tempo real de todos os leitos"
        actions={
          <Link href="/estrutura/configurar" className="btn-secondary flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" />
            Configurar estrutura
          </Link>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Legenda + contadores */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(statusConfig).map(([status, cfg]) => {
            const count = bedList.filter(b => b.status === status).length
            return (
              <div key={status} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium', cfg.color)}>
                <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                {cfg.label}
                <span className="font-bold">{count}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ml-auto">
            Total: <span className="font-bold">{counts.total}</span> leitos
          </div>
        </div>

        {/* Mapa por unidade */}
        {units && units.length > 0 ? (
          <div className="space-y-6">
            {units.map(unit => {
              const unitBeds = bedsByUnit[unit.id] ?? []
              if (unitBeds.length === 0) return null

              return (
                <div key={unit.id} className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display font-bold text-gray-800">{unit.name}</h2>
                      {unit.floor && <p className="text-sm text-gray-400">{unit.floor}</p>}
                    </div>
                    <div className="flex gap-2">
                      <span className="badge badge-accent">{unitBeds.filter(b => b.status === 'available').length} livres</span>
                      <span className="badge badge-error">{unitBeds.filter(b => b.status === 'occupied').length} ocupados</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                    {unitBeds.map(bed => {
                      const cfg = statusConfig[bed.status]
                      return (
                        <button
                          key={bed.id}
                          title={`Quarto ${bed.rooms?.number} — Leito ${bed.code}\n${cfg.label}`}
                          className={cn(
                            'rounded-xl p-3 text-center transition-all hover:scale-105 active:scale-95 cursor-pointer border',
                            cfg.color
                          )}
                        >
                          <p className="font-display font-bold text-base leading-none">
                            {bed.rooms?.number}{bed.code}
                          </p>
                          <p className="text-xs mt-1 opacity-70">{cfg.label}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-16 max-w-md mx-auto">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display font-bold text-gray-800 mb-2">Estrutura não configurada</h2>
            <p className="text-gray-500 text-sm mb-6">
              Cadastre as unidades, setores, quartos e leitos do hospital para visualizar o mapa.
            </p>
            <Link href="/estrutura/configurar" className="btn-primary text-sm inline-flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurar estrutura
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
