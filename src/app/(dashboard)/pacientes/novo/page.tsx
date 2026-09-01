'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { cn } from '@/lib/utils'
import { Loader2, Save, ChevronRight, User, MapPin, HeartPulse, CreditCard, Phone } from 'lucide-react'

type Tab = 'dados' | 'endereco' | 'saude' | 'cobertura' | 'contatos'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dados',     label: 'Dados pessoais', icon: User },
  { id: 'endereco',  label: 'Endereço',        icon: MapPin },
  { id: 'saude',     label: 'Saúde',           icon: HeartPulse },
  { id: 'cobertura', label: 'Cobertura',       icon: CreditCard },
  { id: 'contatos',  label: 'Contatos',        icon: Phone },
]

interface FormData {
  // Dados pessoais
  full_name: string
  social_name: string
  birth_date: string
  gender: string
  cpf: string
  rg: string
  rg_issuer: string
  cns: string
  mother_name: string
  father_name: string
  phone: string
  phone2: string
  email: string
  // Endereço
  zip_code: string
  street: string
  address_number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  // Saúde
  blood_type: string
  ethnicity: string
  nationality: string
  // Cobertura
  insurance_type: string
  insurance_name: string
  insurance_card: string
  insurance_plan: string
  insurance_validity: string
  // Notas
  notes: string
}

const initialForm: FormData = {
  full_name: '', social_name: '', birth_date: '', gender: '', cpf: '',
  rg: '', rg_issuer: '', cns: '', mother_name: '', father_name: '',
  phone: '', phone2: '', email: '',
  zip_code: '', street: '', address_number: '', complement: '',
  neighborhood: '', city: '', state: '',
  blood_type: '', ethnicity: '', nationality: 'Brasileira',
  insurance_type: 'sus', insurance_name: '', insurance_card: '',
  insurance_plan: '', insurance_validity: '',
  notes: '',
}

// Contato de emergência
interface Contact { name: string; relationship: string; phone: string; is_primary: boolean }
const emptyContact = (): Contact => ({ name: '', relationship: '', phone: '', is_primary: false })

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('input-field', className)} {...props} />
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('input-field', className)} {...props}>
      {children}
    </select>
  )
}

export default function NovoPacientePage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('dados')
  const [form, setForm] = useState<FormData>(initialForm)
  const [contacts, setContacts] = useState<Contact[]>([emptyContact()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setContact(index: number, field: keyof Contact, value: string | boolean) {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function addContact() {
    setContacts(prev => [...prev, emptyContact()])
  }

  async function fetchCEP() {
    const cep = form.zip_code.replace(/\D/g, '')
    if (cep.length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (!data.erro) {
      setForm(prev => ({
        ...prev,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }))
    }
  }

  async function handleSave() {
    if (!form.full_name || !form.birth_date) {
      setError('Nome completo e data de nascimento são obrigatórios.')
      setTab('dados')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      cpf:           form.cpf.replace(/\D/g, '') || null,
      cns:           form.cns.replace(/\D/g, '') || null,
      rg:            form.rg || null,
      rg_issuer:     form.rg_issuer || null,
      social_name:   form.social_name || null,
      mother_name:   form.mother_name || null,
      father_name:   form.father_name || null,
      phone:         form.phone || null,
      phone2:        form.phone2 || null,
      email:         form.email || null,
      zip_code:      form.zip_code || null,
      street:        form.street || null,
      address_number:form.address_number || null,
      complement:    form.complement || null,
      neighborhood:  form.neighborhood || null,
      city:          form.city || null,
      state:         form.state || null,
      blood_type:    form.blood_type || null,
      ethnicity:     form.ethnicity || null,
      gender:        form.gender || null,
      insurance_name:       form.insurance_name || null,
      insurance_card:       form.insurance_card || null,
      insurance_plan:       form.insurance_plan || null,
      insurance_validity:   form.insurance_validity || null,
      notes:         form.notes || null,
    }

    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert(payload)
      .select('id')
      .single()

    if (patientError) {
      setError(patientError.message)
      setSaving(false)
      return
    }

    // Inserir contatos
    const validContacts = contacts.filter(c => c.name && c.phone)
    if (validContacts.length > 0) {
      await supabase.from('patient_contacts').insert(
        validContacts.map(c => ({ ...c, patient_id: patient.id }))
      )
    }

    router.push(`/pacientes/${patient.id}`)
  }

  return (
    <>
      <Header
        title="Novo Paciente"
        subtitle="Preencha os dados do paciente"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar paciente
          </button>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="card mb-4 p-0 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {tabs.map((t, i) => {
                const Icon = t.icon
                const active = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                      active
                        ? 'border-accent text-accent bg-accent/5'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-surface'
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      active ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500'
                    )}>
                      {i + 1}
                    </span>
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            <div className="p-6">
              {/* DADOS PESSOAIS */}
              {tab === 'dados' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Nome completo" required>
                      <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nome completo do paciente" />
                    </Field>
                  </div>
                  <Field label="Nome social">
                    <Input value={form.social_name} onChange={e => set('social_name', e.target.value)} placeholder="Nome social (se houver)" />
                  </Field>
                  <Field label="Sexo">
                    <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="O">Outro</option>
                      <option value="NI">Não informado</option>
                    </Select>
                  </Field>
                  <Field label="Data de nascimento" required>
                    <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
                  </Field>
                  <Field label="CPF">
                    <Input value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="RG">
                    <Input value={form.rg} onChange={e => set('rg', e.target.value)} placeholder="Número do RG" />
                  </Field>
                  <Field label="Órgão emissor do RG">
                    <Input value={form.rg_issuer} onChange={e => set('rg_issuer', e.target.value)} placeholder="Ex: SSP/SP" />
                  </Field>
                  <Field label="Cartão Nacional de Saúde (CNS)">
                    <Input value={form.cns} onChange={e => set('cns', e.target.value)} placeholder="000 0000 0000 0000" />
                  </Field>
                  <Field label="Telefone">
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
                  </Field>
                  <Field label="Telefone 2">
                    <Input value={form.phone2} onChange={e => set('phone2', e.target.value)} placeholder="(00) 00000-0000" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="E-mail">
                      <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="paciente@email.com" />
                    </Field>
                  </div>
                  <Field label="Nome da mãe">
                    <Input value={form.mother_name} onChange={e => set('mother_name', e.target.value)} />
                  </Field>
                  <Field label="Nome do pai">
                    <Input value={form.father_name} onChange={e => set('father_name', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* ENDEREÇO */}
              {tab === 'endereco' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="CEP">
                    <div className="flex gap-2">
                      <Input
                        value={form.zip_code}
                        onChange={e => set('zip_code', e.target.value)}
                        onBlur={fetchCEP}
                        placeholder="00000-000"
                        className="flex-1"
                      />
                      <button type="button" onClick={fetchCEP} className="btn-secondary text-sm px-3">
                        Buscar
                      </button>
                    </div>
                  </Field>
                  <Field label="Estado">
                    <Select value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">Selecione</option>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                        'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Logradouro">
                      <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="Rua, Avenida, etc." />
                    </Field>
                  </div>
                  <Field label="Número">
                    <Input value={form.address_number} onChange={e => set('address_number', e.target.value)} />
                  </Field>
                  <Field label="Complemento">
                    <Input value={form.complement} onChange={e => set('complement', e.target.value)} placeholder="Apto, Bloco, etc." />
                  </Field>
                  <Field label="Bairro">
                    <Input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
                  </Field>
                  <Field label="Cidade">
                    <Input value={form.city} onChange={e => set('city', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* SAÚDE */}
              {tab === 'saude' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tipo sanguíneo">
                    <Select value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
                      <option value="">Não informado</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Etnia/Raça">
                    <Select value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)}>
                      <option value="">Não informado</option>
                      <option value="branca">Branca</option>
                      <option value="preta">Preta</option>
                      <option value="parda">Parda</option>
                      <option value="amarela">Amarela</option>
                      <option value="indigena">Indígena</option>
                    </Select>
                  </Field>
                  <Field label="Nacionalidade">
                    <Input value={form.nationality} onChange={e => set('nationality', e.target.value)} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Observações clínicas">
                      <textarea
                        value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        rows={4}
                        className="input-field resize-none"
                        placeholder="Informações adicionais relevantes para o atendimento..."
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* COBERTURA */}
              {tab === 'cobertura' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tipo de cobertura">
                    <Select value={form.insurance_type} onChange={e => set('insurance_type', e.target.value)}>
                      <option value="sus">SUS</option>
                      <option value="convenio">Convênio</option>
                      <option value="particular">Particular</option>
                      <option value="empresa">Empresa</option>
                    </Select>
                  </Field>
                  {form.insurance_type !== 'sus' && form.insurance_type !== 'particular' && (
                    <>
                      <Field label="Nome do convênio / empresa">
                        <Input value={form.insurance_name} onChange={e => set('insurance_name', e.target.value)} />
                      </Field>
                      <Field label="Número da carteirinha">
                        <Input value={form.insurance_card} onChange={e => set('insurance_card', e.target.value)} />
                      </Field>
                      <Field label="Plano">
                        <Input value={form.insurance_plan} onChange={e => set('insurance_plan', e.target.value)} />
                      </Field>
                      <Field label="Validade">
                        <Input type="date" value={form.insurance_validity} onChange={e => set('insurance_validity', e.target.value)} />
                      </Field>
                    </>
                  )}
                  {form.insurance_type === 'sus' && (
                    <div className="md:col-span-2 bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-accent-600">
                      Atendimento via SUS. O CNS pode ser informado na aba "Dados pessoais".
                    </div>
                  )}
                </div>
              )}

              {/* CONTATOS */}
              {tab === 'contatos' && (
                <div className="space-y-4">
                  {contacts.map((contact, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 bg-surface/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-semibold text-sm text-gray-700">
                          Contato {i + 1}
                          {i === 0 && <span className="ml-2 badge badge-accent">Principal</span>}
                        </h3>
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contact.is_primary}
                            onChange={e => setContact(i, 'is_primary', e.target.checked)}
                            className="rounded border-gray-300 text-accent focus:ring-accent"
                          />
                          Contato principal
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                          <Field label="Nome">
                            <Input value={contact.name} onChange={e => setContact(i, 'name', e.target.value)} />
                          </Field>
                        </div>
                        <Field label="Parentesco">
                          <Select value={contact.relationship} onChange={e => setContact(i, 'relationship', e.target.value)}>
                            <option value="">Selecione</option>
                            <option value="mae">Mãe</option>
                            <option value="pai">Pai</option>
                            <option value="conjuge">Cônjuge</option>
                            <option value="filho">Filho(a)</option>
                            <option value="irmao">Irmão/Irmã</option>
                            <option value="outro">Outro</option>
                          </Select>
                        </Field>
                        <Field label="Telefone">
                          <Input value={contact.phone} onChange={e => setContact(i, 'phone', e.target.value)} placeholder="(00) 00000-0000" />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addContact} className="btn-ghost text-sm flex items-center gap-2">
                    + Adicionar contato
                  </button>
                </div>
              )}

              {/* Navegação */}
              <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const idx = tabs.findIndex(t => t.id === tab)
                    if (idx > 0) setTab(tabs[idx - 1].id)
                  }}
                  className="btn-ghost text-sm"
                  disabled={tab === 'dados'}
                >
                  ← Anterior
                </button>
                {tab !== 'contatos' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = tabs.findIndex(t => t.id === tab)
                      setTab(tabs[idx + 1].id)
                    }}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar paciente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
