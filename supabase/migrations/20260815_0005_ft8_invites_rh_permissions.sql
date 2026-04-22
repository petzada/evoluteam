-- FT-8 — Permite congelar os toggles de RH no convite.
-- Quando o Administrador convida um RH com permissoes pre-configuradas
-- no sheet de Novo Colaborador, a gente grava o shape em invites.rh_permissions.
-- Ao aceitar o convite, acceptInvite le essa coluna e aplica em rh_permissions
-- do novo profile (o trigger sync_rh_permissions_on_role_change ja criou o
-- registro vazio; aqui so atualizamos os booleanos).

ALTER TABLE invites
  ADD COLUMN IF NOT EXISTS rh_permissions jsonb;

COMMENT ON COLUMN invites.rh_permissions IS
  'Snapshot dos 6 toggles (can_employees/can_reviews/can_recruitment/can_pdi_feedback/can_invites/can_audit) configurados no convite. Aplicado ao aceitar.';
