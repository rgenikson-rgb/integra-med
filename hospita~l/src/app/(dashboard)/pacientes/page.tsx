import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import Link from 'next/link'
import { Plus, Search, User, Phone, CreditCard } from 'lucide-react'
import { formatDate, calcAge, insuranceLabels, formatCPF, cn } from '@/lib/utils'
import type { Patient } from '@/types/database'

const insuranceBadge: Record<string, string> = {
  sus:       'badge-accent',
  convenio:  'badge-primary',
  particular:'badge-warning',
  empresa:   'badge-gray',
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('patients')
    .select('*')
    .eq('is_active', true)
    .order('full_name')

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,cpf.ilike.%${q}%,medical_record_number.ilike.%${q}%,cns.ilike.%${q}%`
    )
  }

  const { data: patients } = await query.limit(50)

  return (
    <>
      <Header
        title="Pacientes"
        subtitle="Cadastro de pacientes"
        actions={
          <Link href="/pacientes/novo" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Novo paciente
          </Link>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Busca */}
        <div className="card mb-4">
          <form method="GET" className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-gray-100">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                name="q"
                defaultValue={q}
                type="text"
                placeholder="Buscar por nome, CPF, prontuário ou CNS..."
                className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none flex-1"
              />
            </div>
            <button type="submit" className="btn-primary text-sm px-4 py-2">
              Buscar
            </button>
          </form>
        </div>

        {/* Tabela */}
        <div className="card p-0 overflow-hidden">
          {patients && patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface">
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Prontuário</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Paciente</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden md:table-cell">CPF</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden lg:table-cell">Nasc. / Idade</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden md:table-cell">Cobertura</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden lg:table-cell">Telefone</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {patients.map((patient: Patient) => (
                    <tr key={patient.id} className="hover:bg-surface/60 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-primary font-semibold">
                          {patient.medical_record_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{patient.full_name}</p>
                            {patient.social_name && (
                              <p className="text-xs text-gray-400">Social: {patient.social_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {patient.cpf ? formatCPF(patient.cpf) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {patient.birth_date ? (
                          <>
                            {formatDate(patient.birth_date)}
                            <span className="text-gray-400 text-xs ml-1">({calcAge(patient.birth_date)} anos)</span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn('badge', insuranceBadge[patient.insurance_type] ?? 'badge-gray')}>
                          {insuranceLabels[patient.insurance_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {patient.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {patient.phone}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/pacientes/${patient.id}`}
                          className="text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                        >
                          Ver prontuário →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-600">
                {q ? `Nenhum paciente encontrado para "${q}"` : 'Nenhum paciente cadastrado'}
              </p>
              {!q && (
                <Link href="/pacientes/novo" className="btn-primary text-sm inline-flex items-center gap-2 mt-4">
                  <Plus className="w-4 h-4" />
                  Cadastrar primeiro paciente
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
