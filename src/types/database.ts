export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          social_name: string | null
          cpf: string | null
          cns: string | null
          crm: string | null
          coren: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      hospitals: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          cnes: string | null
          address: string | null
          city: string | null
          state: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['hospitals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>
      }
      units: {
        Row: {
          id: string
          hospital_id: string
          name: string
          code: string | null
          type: string | null
          floor: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['units']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['units']['Insert']>
      }
      sectors: {
        Row: {
          id: string
          unit_id: string
          name: string
          code: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sectors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sectors']['Insert']>
      }
      rooms: {
        Row: {
          id: string
          sector_id: string
          number: string
          type: string | null
          max_beds: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rooms']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      beds: {
        Row: {
          id: string
          room_id: string
          code: string
          type: string | null
          status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved' | 'blocked'
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['beds']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['beds']['Insert']>
      }
      patients: {
        Row: {
          id: string
          full_name: string
          social_name: string | null
          birth_date: string
          gender: 'M' | 'F' | 'O' | 'NI' | null
          cpf: string | null
          rg: string | null
          rg_issuer: string | null
          cns: string | null
          medical_record_number: string | null
          phone: string | null
          phone2: string | null
          email: string | null
          zip_code: string | null
          street: string | null
          address_number: string | null
          complement: string | null
          neighborhood: string | null
          city: string | null
          state: string | null
          blood_type: string | null
          ethnicity: string | null
          nationality: string
          mother_name: string | null
          father_name: string | null
          insurance_type: 'sus' | 'convenio' | 'particular' | 'empresa'
          insurance_name: string | null
          insurance_card: string | null
          insurance_plan: string | null
          insurance_validity: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'medical_record_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      patient_contacts: {
        Row: {
          id: string
          patient_id: string
          name: string
          relationship: string | null
          phone: string
          phone2: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['patient_contacts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['patient_contacts']['Insert']>
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      permissions: {
        Row: {
          id: string
          code: string
          description: string | null
          module: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['permissions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          hospital_id: string | null
          unit_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PRINT'
          resource: string
          resource_id: string | null
          old_data: Json | null
          new_data: Json | null
          description: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Functions: {
      has_permission: {
        Args: { permission_code: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}

// Helpers de tipo
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile        = Tables<'profiles'>
export type Hospital       = Tables<'hospitals'>
export type Unit           = Tables<'units'>
export type Sector         = Tables<'sectors'>
export type Room           = Tables<'rooms'>
export type Bed            = Tables<'beds'>
export type Patient        = Tables<'patients'>
export type PatientContact = Tables<'patient_contacts'>
export type Role           = Tables<'roles'>
export type Permission     = Tables<'permissions'>
export type UserRole       = Tables<'user_roles'>
export type AuditLog       = Tables<'audit_logs'>

export type BedStatus = Bed['status']
export type InsuranceType = Patient['insurance_type']
