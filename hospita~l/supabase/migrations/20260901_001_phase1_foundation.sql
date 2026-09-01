-- =============================================================================
-- IntegraMed — Fase 1: Fundação
-- Migration: 20260901_001_phase1_foundation.sql
-- =============================================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================================
-- PROFILES (estende auth.users do Supabase)
-- =============================================================================

CREATE TABLE profiles (
  id            UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  social_name   TEXT,
  cpf           TEXT        UNIQUE,
  cns           TEXT,                           -- Cartão Nacional de Saúde
  crm           TEXT,                           -- Médicos
  coren         TEXT,                           -- Enfermeiros
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfis dos usuários do sistema, estende auth.users';

-- =============================================================================
-- HOSPITAL
-- =============================================================================

CREATE TABLE hospitals (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL,
  cnpj          TEXT        UNIQUE,
  cnes          TEXT        UNIQUE,             -- Cadastro Nacional de Estab. de Saúde
  address       TEXT,
  city          TEXT,
  state         TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE hospitals IS 'Cadastro do(s) hospital(is) do sistema';

-- =============================================================================
-- UNITS (Unidades — ex: Clínica Médica, UTI, Pediatria)
-- =============================================================================

CREATE TABLE units (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id   UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  code          TEXT,
  type          TEXT,                           -- 'enfermaria','uti','pronto_atendimento','centro_cirurgico','ambulatorio'
  floor         TEXT,
  description   TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE units IS 'Unidades hospitalares (ex: Clínica Médica, UTI)';

-- =============================================================================
-- SECTORS (Setores dentro de uma unidade)
-- =============================================================================

CREATE TABLE sectors (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id       UUID        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  code          TEXT,
  description   TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sectors IS 'Setores dentro de uma unidade hospitalar';

-- =============================================================================
-- ROOMS (Quartos)
-- =============================================================================

CREATE TABLE rooms (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id     UUID        NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  number        TEXT        NOT NULL,
  type          TEXT,                           -- 'enfermaria','particular','isolamento','bercario'
  max_beds      INT         DEFAULT 1,
  description   TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rooms IS 'Quartos dentro de um setor';

-- =============================================================================
-- BEDS (Leitos)
-- =============================================================================

CREATE TABLE beds (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  code          TEXT        NOT NULL,           -- 'A', 'B', '1', '2'
  type          TEXT,                           -- 'adulto','pediatrico','berco','maca'
  status        TEXT        NOT NULL DEFAULT 'available'
                              CHECK (status IN (
                                'available',    -- 🟢 Disponível
                                'occupied',     -- 🔴 Ocupado
                                'cleaning',     -- 🟡 Em limpeza
                                'maintenance',  -- 🔧 Em manutenção
                                'reserved',     -- 🔵 Reservado
                                'blocked'       -- ⛔ Bloqueado
                              )),
  notes         TEXT,
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE beds IS 'Leitos hospitalares com controle de status';

-- =============================================================================
-- PATIENTS (Pacientes)
-- =============================================================================

CREATE TABLE patients (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificação
  full_name             TEXT        NOT NULL,
  social_name           TEXT,
  birth_date            DATE        NOT NULL,
  gender                TEXT        CHECK (gender IN ('M','F','O','NI')),
  cpf                   TEXT        UNIQUE,
  rg                    TEXT,
  rg_issuer             TEXT,
  cns                   TEXT        UNIQUE,     -- Cartão Nacional de Saúde

  -- Prontuário
  medical_record_number TEXT        UNIQUE,     -- Gerado automaticamente

  -- Contato
  phone                 TEXT,
  phone2                TEXT,
  email                 TEXT,

  -- Endereço
  zip_code              TEXT,
  street                TEXT,
  address_number        TEXT,
  complement            TEXT,
  neighborhood          TEXT,
  city                  TEXT,
  state                 TEXT,

  -- Informações clínicas básicas
  blood_type            TEXT        CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','NI')),
  ethnicity             TEXT,
  nationality           TEXT        DEFAULT 'Brasileira',
  mother_name           TEXT,
  father_name           TEXT,

  -- Convênio / cobertura
  insurance_type        TEXT        NOT NULL DEFAULT 'sus'
                                      CHECK (insurance_type IN ('sus','convenio','particular','empresa')),
  insurance_name        TEXT,
  insurance_card        TEXT,
  insurance_plan        TEXT,
  insurance_validity    DATE,

  -- Controle
  is_active             BOOLEAN     DEFAULT true,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE patients IS 'Cadastro central de pacientes (longitudinal)';

-- Sequence para número de prontuário
CREATE SEQUENCE IF NOT EXISTS medical_record_seq START 1;

-- Função para gerar número de prontuário automático
CREATE OR REPLACE FUNCTION generate_medical_record_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.medical_record_number IS NULL THEN
    NEW.medical_record_number := 'P' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                                  LPAD(nextval('medical_record_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_medical_record_number
  BEFORE INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION generate_medical_record_number();

-- =============================================================================
-- PATIENT CONTACTS (Contatos de emergência)
-- =============================================================================

CREATE TABLE patient_contacts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id    UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  relationship  TEXT,                           -- 'mae','pai','conjuge','filho','irmao','outro'
  phone         TEXT        NOT NULL,
  phone2        TEXT,
  is_primary    BOOLEAN     DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE patient_contacts IS 'Contatos de emergência do paciente';

-- =============================================================================
-- ROLES (Perfis de acesso)
-- =============================================================================

CREATE TABLE roles (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT        NOT NULL UNIQUE,
  description   TEXT,
  is_system     BOOLEAN     DEFAULT false,      -- Perfis do sistema não podem ser deletados
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Perfis/papéis dos usuários no sistema';

-- =============================================================================
-- PERMISSIONS (Permissões granulares)
-- =============================================================================

CREATE TABLE permissions (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code          TEXT        NOT NULL UNIQUE,    -- ex: 'patients.create', 'beds.view'
  description   TEXT,
  module        TEXT        NOT NULL,           -- ex: 'patients', 'beds', 'users'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Permissões granulares do sistema';

-- =============================================================================
-- ROLE PERMISSIONS (Permissões por perfil)
-- =============================================================================

CREATE TABLE role_permissions (
  role_id       UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID        NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- =============================================================================
-- USER ROLES (Perfis do usuário por unidade)
-- =============================================================================

CREATE TABLE user_roles (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id       UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  hospital_id   UUID        REFERENCES hospitals(id),
  unit_id       UUID        REFERENCES units(id),  -- NULL = hospital inteiro
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role_id, unit_id)
);

COMMENT ON TABLE user_roles IS 'Associação usuário-perfil com escopo por unidade';

-- =============================================================================
-- AUDIT LOGS (Trilha de auditoria)
-- =============================================================================

CREATE TABLE audit_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id),
  user_name     TEXT,
  action        TEXT        NOT NULL
                              CHECK (action IN (
                                'CREATE','UPDATE','DELETE','VIEW',
                                'LOGIN','LOGOUT','EXPORT','PRINT'
                              )),
  resource      TEXT        NOT NULL,           -- nome da tabela/entidade
  resource_id   TEXT,                           -- ID do registro afetado
  old_data      JSONB,                          -- valor anterior
  new_data      JSONB,                          -- novo valor
  description   TEXT,                           -- descrição legível
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Trilha de auditoria de todas as operações do sistema';

-- Índices de auditoria
CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource   ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- Patients
CREATE INDEX idx_patients_cpf         ON patients(cpf);
CREATE INDEX idx_patients_cns         ON patients(cns);
CREATE INDEX idx_patients_full_name   ON patients USING gin(to_tsvector('portuguese', full_name));
CREATE INDEX idx_patients_record      ON patients(medical_record_number);
CREATE INDEX idx_patients_active      ON patients(is_active);

-- Beds
CREATE INDEX idx_beds_status          ON beds(status);
CREATE INDEX idx_beds_room_id         ON beds(room_id);

-- Units / Sectors / Rooms
CREATE INDEX idx_units_hospital_id    ON units(hospital_id);
CREATE INDEX idx_sectors_unit_id      ON sectors(unit_id);
CREATE INDEX idx_rooms_sector_id      ON rooms(sector_id);

-- User roles
CREATE INDEX idx_user_roles_user_id   ON user_roles(user_id);

-- =============================================================================
-- FUNCTIONS — updated_at automático
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_hospitals_updated_at
  BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_units_updated_at
  BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sectors_updated_at
  BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_beds_updated_at
  BEFORE UPDATE ON beds FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- FUNCTION — criar perfil automaticamente ao criar usuário
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE units            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- Helper: verificar se o usuário está autenticado
CREATE OR REPLACE FUNCTION auth_uid() RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: verificar se o usuário tem uma permissão
CREATE OR REPLACE FUNCTION has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND p.code = permission_code
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: verificar se é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: profiles
CREATE POLICY "Usuário vê seu próprio perfil"     ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Usuário edita seu próprio perfil"  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin vê todos os perfis"          ON profiles FOR ALL USING (is_admin());

-- Policies: pacientes — usuários autenticados podem ver e criar
CREATE POLICY "Autenticado vê pacientes"          ON patients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Pode criar paciente"               ON patients FOR INSERT WITH CHECK (has_permission('patients.create'));
CREATE POLICY "Pode editar paciente"              ON patients FOR UPDATE USING (has_permission('patients.update'));
CREATE POLICY "Pode deletar paciente"             ON patients FOR DELETE USING (is_admin());

-- Policies: contatos do paciente
CREATE POLICY "Autenticado vê contatos"           ON patient_contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Pode criar contato"                ON patient_contacts FOR INSERT WITH CHECK (has_permission('patients.update'));
CREATE POLICY "Pode editar contato"               ON patient_contacts FOR UPDATE USING (has_permission('patients.update'));
CREATE POLICY "Pode deletar contato"              ON patient_contacts FOR DELETE USING (has_permission('patients.update'));

-- Policies: estrutura hospitalar — todos autenticados visualizam
CREATE POLICY "Autenticado vê hospitals"          ON hospitals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia hospitals"          ON hospitals FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê units"              ON units FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia units"              ON units FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê sectors"            ON sectors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia sectors"            ON sectors FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê rooms"              ON rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia rooms"              ON rooms FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê beds"               ON beds FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Pode gerenciar leitos"             ON beds FOR ALL USING (has_permission('beds.manage'));

-- Policies: roles e permissões — somente leitura para autenticados, escrita para admin
CREATE POLICY "Autenticado vê roles"              ON roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia roles"              ON roles FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê permissions"        ON permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia permissions"        ON permissions FOR ALL USING (is_admin());

CREATE POLICY "Autenticado vê role_permissions"   ON role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia role_permissions"   ON role_permissions FOR ALL USING (is_admin());

CREATE POLICY "Usuário vê seus próprios roles"    ON user_roles FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admin gerencia user_roles"         ON user_roles FOR ALL USING (is_admin());

-- Policies: audit logs — somente admin e o próprio usuário
CREATE POLICY "Usuário vê seu próprio audit"      ON audit_logs FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Sistema insere audit"              ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
