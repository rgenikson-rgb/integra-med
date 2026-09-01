import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata CPF: 000.000.000-00 */
export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/** Formata CNS: 000 0000 0000 0000 */
export function formatCNS(cns: string): string {
  return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4')
}

/** Formata telefone brasileiro */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

/** Formata CEP: 00000-000 */
export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
}

/** Calcula idade a partir da data de nascimento */
export function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/** Formata data para pt-BR */
export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

/** Formata datetime para pt-BR */
export function formatDateTime(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR')
}

/** Iniciais do nome para avatar */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

/** Rótulos de tipo de cobertura */
export const insuranceLabels: Record<string, string> = {
  sus:       'SUS',
  convenio:  'Convênio',
  particular: 'Particular',
  empresa:   'Empresa',
}

/** Rótulos de gênero */
export const genderLabels: Record<string, string> = {
  M:  'Masculino',
  F:  'Feminino',
  O:  'Outro',
  NI: 'Não informado',
}
