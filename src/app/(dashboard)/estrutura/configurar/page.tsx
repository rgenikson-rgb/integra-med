'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Plus, Trash2, ChevronDown, ChevronRight, BedDouble, Building2, Layers, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Unit, Sector, Room, Bed } from '@/types/database'

const bedStatusOptions: { value: Bed['status']; label: string }[] = [
  { value: 'available',   label: 'Disponível' },
  { value: 'occupied',    label: 'Ocupado' },
  { value: 'cleaning',    label: 'Limpeza' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'reserved',    label: 'Reservado' },
  { value: 'blocked',     label: 'Bloqueado' },
]

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input-field', className)} {...props} />
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input-field" {...props}>{children}</select>
}

export default function ConfigurarEstruturePage() {
  const supabase = createClient()

  const [units, setUnits] = useState<Unit[]>([])
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
  const [sectors, setSectors] = useState<Record<string, Sector[]>>({})
  const [expandedSector, setExpandedSector] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Record<string, Room[]>>({})
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [beds, setBeds] = useState<Record<string, Bed[]>>({})

  // Forms
  const [newUnit, setNewUnit] = useState({ name: '', code: '', type: '', floor: '' })
  const [newSector, setNewSector] = useState<Record<string, { name: string; code: string }>>({})
  const [newRoom, setNewRoom] = useState<Record<string, { number: string; type: string }>>({})
  const [newBed, setNewBed] = useState<Record<string, { code: string; type: string }>>({})

  const loadUnits = useCallback(async () => {
    const { data } = await supabase.from('units').select('*').eq('is_active', true).order('name')
    setUnits(data ?? [])
  }, [supabase])

  useEffect(() => { loadUnits() }, [loadUnits])

  async function loadSectors(unitId: string) {
    const { data } = await supabase.from('sectors').select('*').eq('unit_id', unitId).eq('is_active', true).order('name')
    setSectors(prev => ({ ...prev, [unitId]: data ?? [] }))
  }

  async function loadRooms(sectorId: string) {
    const { data } = await supabase.from('rooms').select('*').eq('sector_id', sectorId).eq('is_active', true).order('number')
    setRooms(prev => ({ ...prev, [sectorId]: data ?? [] }))
  }

  async function loadBeds(roomId: string) {
    const { data } = await supabase.from('beds').select('*').eq('room_id', roomId).eq('is_active', true).order('code')
    setBeds(prev => ({ ...prev, [roomId]: data ?? [] }))
  }

  async function toggleUnit(unitId: string) {
    if (expandedUnit === unitId) { setExpandedUnit(null); return }
    setExpandedUnit(unitId)
    await loadSectors(unitId)
  }

  async function toggleSector(sectorId: string) {
    if (expandedSector === sectorId) { setExpandedSector(null); return }
    setExpandedSector(sectorId)
    await loadRooms(sectorId)
  }

  async function toggleRoom(roomId: string) {
    if (expandedRoom === roomId) { setExpandedRoom(null); return }
    setExpandedRoom(roomId)
    await loadBeds(roomId)
  }

  // --- CRUD ---

  async function createUnit() {
    if (!newUnit.name) return
    await supabase.from('units').insert({ ...newUnit, hospital_id: await getDefaultHospitalId() })
    setNewUnit({ name: '', code: '', type: '', floor: '' })
    loadUnits()
  }

  async function getDefaultHospitalId() {
    const { data } = await supabase.from('hospitals').select('id').eq('is_active', true).limit(1).single()
    return data?.id ?? ''
  }

  async function createSector(unitId: string) {
    const s = newSector[unitId]
    if (!s?.name) return
    await supabase.from('sectors').insert({ ...s, unit_id: unitId })
    setNewSector(prev => ({ ...prev, [unitId]: { name: '', code: '' } }))
    loadSectors(unitId)
  }

  async function createRoom(sectorId: string) {
    const r = newRoom[sectorId]
    if (!r?.number) return
    await supabase.from('rooms').insert({ ...r, sector_id: sectorId })
    setNewRoom(prev => ({ ...prev, [sectorId]: { number: '', type: '' } }))
    loadRooms(sectorId)
  }

  async function createBed(roomId: string) {
    const b = newBed[roomId]
    if (!b?.code) return
    await supabase.from('beds').insert({ code: b.code, type: b.type || null, room_id: roomId })
    setNewBed(prev => ({ ...prev, [roomId]: { code: '', type: '' } }))
    loadBeds(roomId)
  }

  async function deleteUnit(id: string) {
    await supabase.from('units').update({ is_active: false }).eq('id', id)
    loadUnits()
  }

  return (
    <>
      <Header title="Configurar Estrutura" subtitle="Gerencie unidades, setores, quartos e leitos" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Criar unidade */}
          <div className="card">
            <h2 className="font-display font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-primary" />
              Nova unidade
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="col-span-2">
                <Input
                  placeholder="Nome da unidade *"
                  value={newUnit.name}
                  onChange={e => setNewUnit(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <Input placeholder="Código" value={newUnit.code} onChange={e => setNewUnit(p => ({ ...p, code: e.target.value }))} />
              <Input placeholder="Andar" value={newUnit.floor} onChange={e => setNewUnit(p => ({ ...p, floor: e.target.value }))} />
              <Select value={newUnit.type} onChange={e => setNewUnit(p => ({ ...p, type: e.target.value }))}>
                <option value="">Tipo</option>
                <option value="enfermaria">Enfermaria</option>
                <option value="uti">UTI</option>
                <option value="pronto_atendimento">Pronto Atendimento</option>
                <option value="centro_cirurgico">Centro Cirúrgico</option>
                <option value="ambulatorio">Ambulatório</option>
                <option value="pediatria">Pediatria</option>
                <option value="maternidade">Maternidade</option>
              </Select>
            </div>
            <button onClick={createUnit} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar unidade
            </button>
          </div>

          {/* Lista de unidades */}
          {units.map(unit => (
            <div key={unit.id} className="card p-0 overflow-hidden">
              {/* Header da unidade */}
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface transition-colors text-left"
              >
                {expandedUnit === unit.id ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-display font-semibold text-gray-800 flex-1">{unit.name}</span>
                {unit.code && <span className="text-xs text-gray-400 font-mono">{unit.code}</span>}
                {unit.type && <span className="badge badge-primary capitalize">{unit.type.replace('_', ' ')}</span>}
                <button
                  onClick={e => { e.stopPropagation(); deleteUnit(unit.id) }}
                  className="ml-2 p-1 rounded text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>

              {/* Setores */}
              {expandedUnit === unit.id && (
                <div className="border-t border-gray-100">
                  {/* Criar setor */}
                  <div className="px-5 py-3 bg-surface/60 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                    <Input
                      placeholder="Nome do setor"
                      value={newSector[unit.id]?.name ?? ''}
                      onChange={e => setNewSector(p => ({ ...p, [unit.id]: { ...(p[unit.id] ?? {}), name: e.target.value } }))}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Código"
                      value={newSector[unit.id]?.code ?? ''}
                      onChange={e => setNewSector(p => ({ ...p, [unit.id]: { ...(p[unit.id] ?? {}), code: e.target.value } }))}
                      className="h-8 text-xs w-24"
                    />
                    <button onClick={() => createSector(unit.id)} className="btn-accent text-xs px-3 py-1.5 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Setor
                    </button>
                  </div>

                  {/* Lista de setores */}
                  {(sectors[unit.id] ?? []).map(sector => (
                    <div key={sector.id} className="border-t border-gray-50">
                      <button
                        onClick={() => toggleSector(sector.id)}
                        className="w-full flex items-center gap-3 px-8 py-3 hover:bg-surface transition-colors text-left"
                      >
                        {expandedSector === sector.id ? <ChevronDown className="w-3.5 h-3.5 text-secondary" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                        <Layers className="w-3.5 h-3.5 text-secondary" />
                        <span className="font-medium text-sm text-gray-700 flex-1">{sector.name}</span>
                        {sector.code && <span className="text-xs text-gray-400 font-mono">{sector.code}</span>}
                      </button>

                      {/* Quartos */}
                      {expandedSector === sector.id && (
                        <div className="border-t border-gray-50">
                          {/* Criar quarto */}
                          <div className="px-10 py-3 bg-surface/40 flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5 text-secondary/60 flex-shrink-0" />
                            <Input
                              placeholder="Número do quarto"
                              value={newRoom[sector.id]?.number ?? ''}
                              onChange={e => setNewRoom(p => ({ ...p, [sector.id]: { ...(p[sector.id] ?? {}), number: e.target.value } }))}
                              className="h-8 text-xs w-40"
                            />
                            <Select
                              value={newRoom[sector.id]?.type ?? ''}
                              onChange={e => setNewRoom(p => ({ ...p, [sector.id]: { ...(p[sector.id] ?? {}), type: e.target.value } }))}
                              className="h-8 text-xs"
                            >
                              <option value="">Tipo</option>
                              <option value="enfermaria">Enfermaria</option>
                              <option value="particular">Particular</option>
                              <option value="isolamento">Isolamento</option>
                              <option value="bercario">Berçário</option>
                            </Select>
                            <button onClick={() => createRoom(sector.id)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Quarto
                            </button>
                          </div>

                          {/* Lista de quartos */}
                          {(rooms[sector.id] ?? []).map(room => (
                            <div key={room.id} className="border-t border-gray-50">
                              <button
                                onClick={() => toggleRoom(room.id)}
                                className="w-full flex items-center gap-3 px-12 py-2.5 hover:bg-surface transition-colors text-left"
                              >
                                {expandedRoom === room.id ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-300" />}
                                <LayoutGrid className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600 flex-1">Quarto {room.number}</span>
                                {room.type && <span className="text-xs text-gray-400 capitalize">{room.type}</span>}
                              </button>

                              {/* Leitos */}
                              {expandedRoom === room.id && (
                                <div className="border-t border-gray-50 px-14 py-3 space-y-2">
                                  {/* Criar leito */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <BedDouble className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <Input
                                      placeholder="Código do leito (A, B, 1...)"
                                      value={newBed[room.id]?.code ?? ''}
                                      onChange={e => setNewBed(p => ({ ...p, [room.id]: { ...(p[room.id] ?? {}), code: e.target.value } }))}
                                      className="h-8 text-xs w-40"
                                    />
                                    <Select
                                      value={newBed[room.id]?.type ?? ''}
                                      onChange={e => setNewBed(p => ({ ...p, [room.id]: { ...(p[room.id] ?? {}), type: e.target.value } }))}
                                      className="h-8 text-xs"
                                    >
                                      <option value="">Tipo</option>
                                      <option value="adulto">Adulto</option>
                                      <option value="pediatrico">Pediátrico</option>
                                      <option value="berco">Berço</option>
                                      <option value="maca">Maca</option>
                                    </Select>
                                    <button onClick={() => createBed(room.id)} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 border border-gray-200">
                                      <Plus className="w-3 h-3" /> Leito
                                    </button>
                                  </div>

                                  {/* Lista de leitos */}
                                  <div className="flex flex-wrap gap-2">
                                    {(beds[room.id] ?? []).map(bed => (
                                      <div key={bed.id} className="flex items-center gap-2 bg-surface border border-gray-100 rounded-lg px-3 py-1.5">
                                        <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-semibold text-gray-700">{bed.code}</span>
                                        <Select
                                          value={bed.status}
                                          onChange={async e => {
                                            await supabase.from('beds').update({ status: e.target.value as Bed['status'] }).eq('id', bed.id)
                                            loadBeds(room.id)
                                          }}
                                          className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0 w-28"
                                        >
                                          {bedStatusOptions.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                          ))}
                                        </Select>
                                      </div>
                                    ))}
                                    {(beds[room.id] ?? []).length === 0 && (
                                      <p className="text-xs text-gray-400">Nenhum leito cadastrado neste quarto.</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {units.length === 0 && (
            <div className="card text-center py-8 text-gray-500 text-sm">
              Nenhuma unidade cadastrada. Crie a primeira acima.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
