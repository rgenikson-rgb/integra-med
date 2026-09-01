import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { UserCog, CheckCircle2, XCircle, Shield } from 'lucide-react'
import { formatDateTime, getInitials, cn } from '@/lib/utils'

const roleColors: Record<string, string> = {
  admin:       'bg-primary text-white',
  medico:      'bg-accent/10 text-accent-600',
  enfermagem:  'bg-blue-50 text-blue-700',
  recepcao:    'bg-purple-50 text-purple-700',
  farmacia:    'bg-yellow-50 text-yellow-700',
  laboratorio: 'bg-orange-50 text-orange-700',
  faturamento: 'bg-green-50 text-green-700',
  gestao:      'bg-secondary/10 text-secondary',
}

export default async function UsuariosPage() {
  const supabase = await createClient()

  // Buscar perfis com roles
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (
        roles ( name, description )
      )
    `)
    .order('full_name')

  return (
    <>
      <Header
        title="Usuários"
        subtitle="Gerenciamento de usuários e perfis de acesso"
        actions={
          <button className="btn-primary flex items-center gap-2 text-sm">
            <UserCog className="w-4 h-4" />
            Convidar usuário
          </button>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Legenda de perfis */}
        <div className="card mb-4">
          <h3 className="font-display font-semibold text-sm text-gray-600 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Perfis de acesso disponíveis
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleColors).map(([role, color]) => (
              <span key={role} className={cn('badge capitalize', color)}>{role}</span>
            ))}
          </div>
        </div>

        {/* Tabela de usuários */}
        <div className="card p-0 overflow-hidden">
          {profiles && profiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface">
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Usuário</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden md:table-cell">CPF</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Perfis</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600 hidden lg:table-cell">Cadastrado em</th>
                    <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {profiles.map((profile: any) => {
                    const roles = (profile.user_roles ?? [])
                      .map((ur: any) => ur.roles?.name)
                      .filter(Boolean) as string[]

                    return (
                      <tr key={profile.id} className="hover:bg-surface/60 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-xs font-bold font-display">
                                {getInitials(profile.full_name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{profile.full_name}</p>
                              {profile.crm && <p className="text-xs text-gray-400">CRM: {profile.crm}</p>}
                              {profile.coren && <p className="text-xs text-gray-400">COREN: {profile.coren}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                          {profile.cpf ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {roles.length > 0 ? roles.map(role => (
                              <span key={role} className={cn('badge capitalize text-xs', roleColors[role] ?? 'badge-gray')}>
                                {role}
                              </span>
                            )) : (
                              <span className="text-gray-300 text-xs">Sem perfil</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                          {formatDateTime(profile.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {profile.is_active ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400">
                              <XCircle className="w-3.5 h-3.5" /> Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                            Editar →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <UserCog className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-600">Nenhum usuário cadastrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Usuários são criados automaticamente ao se cadastrarem no sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
