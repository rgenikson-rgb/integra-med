-- =============================================================================
-- IntegraMed — Seed: Perfis, Permissões e Hospital padrão
-- =============================================================================

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

INSERT INTO permissions (code, description, module) VALUES
  -- Pacientes
  ('patients.view',       'Visualizar pacientes',               'patients'),
  ('patients.create',     'Cadastrar pacientes',                'patients'),
  ('patients.update',     'Editar dados do paciente',           'patients'),
  ('patients.delete',     'Desativar paciente',                 'patients'),
  ('patients.export',     'Exportar dados de pacientes',        'patients'),

  -- Atendimento
  ('encounters.view',     'Visualizar atendimentos',            'encounters'),
  ('encounters.create',   'Criar atendimento',                  'encounters'),
  ('encounters.update',   'Editar atendimento',                 'encounters'),

  -- Triagem
  ('triage.view',         'Visualizar triagem',                 'triage'),
  ('triage.perform',      'Realizar triagem',                   'triage'),

  -- Prontuário
  ('records.view',        'Visualizar prontuário',              'records'),
  ('records.medical',     'Evoluções médicas',                  'records'),
  ('records.nursing',     'Evoluções de enfermagem',            'records'),
  ('records.prescription','Prescrever medicamentos',            'records'),

  -- Leitos
  ('beds.view',           'Visualizar leitos',                  'beds'),
  ('beds.manage',         'Gerenciar status de leitos',         'beds'),

  -- Estrutura hospitalar
  ('structure.view',      'Visualizar estrutura hospitalar',    'structure'),
  ('structure.manage',    'Gerenciar unidades/setores/leitos',  'structure'),

  -- Usuários
  ('users.view',          'Visualizar usuários',                'users'),
  ('users.manage',        'Gerenciar usuários e permissões',    'users'),

  -- Relatórios
  ('reports.view',        'Visualizar relatórios',              'reports'),
  ('reports.export',      'Exportar relatórios',                'reports'),

  -- Auditoria
  ('audit.view',          'Visualizar logs de auditoria',       'audit'),

  -- Configurações
  ('settings.manage',     'Gerenciar configurações do sistema', 'settings')
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- ROLES
-- =============================================================================

INSERT INTO roles (name, description, is_system) VALUES
  ('admin',           'Administrador do sistema — acesso total',                      true),
  ('medico',          'Médico — prontuário, prescrição, atendimento',                 true),
  ('enfermagem',      'Enfermagem — triagem, evolução, medicamentos',                 true),
  ('recepcao',        'Recepção — cadastro e atendimento',                            true),
  ('farmacia',        'Farmácia — prescrição e dispensação',                          true),
  ('laboratorio',     'Laboratório — solicitação e resultado de exames',              true),
  ('faturamento',     'Faturamento — contas e convênios',                             true),
  ('gestao',          'Gestão — indicadores e relatórios',                            true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- ROLE PERMISSIONS
-- =============================================================================

-- ADMIN: todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- MÉDICO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view','patients.update',
  'encounters.view','encounters.create','encounters.update',
  'triage.view',
  'records.view','records.medical','records.prescription',
  'beds.view',
  'reports.view'
) WHERE r.name = 'medico'
ON CONFLICT DO NOTHING;

-- ENFERMAGEM
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view','patients.update',
  'encounters.view','encounters.update',
  'triage.view','triage.perform',
  'records.view','records.nursing',
  'beds.view','beds.manage'
) WHERE r.name = 'enfermagem'
ON CONFLICT DO NOTHING;

-- RECEPÇÃO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view','patients.create','patients.update',
  'encounters.view','encounters.create',
  'beds.view'
) WHERE r.name = 'recepcao'
ON CONFLICT DO NOTHING;

-- FARMÁCIA
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view',
  'records.view','records.prescription',
  'reports.view'
) WHERE r.name = 'farmacia'
ON CONFLICT DO NOTHING;

-- LABORATÓRIO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view',
  'encounters.view',
  'records.view'
) WHERE r.name = 'laboratorio'
ON CONFLICT DO NOTHING;

-- FATURAMENTO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view',
  'encounters.view',
  'reports.view','reports.export'
) WHERE r.name = 'faturamento'
ON CONFLICT DO NOTHING;

-- GESTÃO
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.code IN (
  'patients.view',
  'encounters.view',
  'beds.view',
  'structure.view',
  'users.view',
  'reports.view','reports.export',
  'audit.view'
) WHERE r.name = 'gestao'
ON CONFLICT DO NOTHING;
