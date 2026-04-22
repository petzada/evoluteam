-- FT-9 — Fase 4: coluna screen_permissions em invites.
-- Spec: docs/dev/21-ft-9-redesign-acessos.md §4.5 / §4.6.
--
-- Armazena o snapshot de toggles pre-configurados pelo convidante.
-- Aplicado no acceptInvite ao criar o user_screen_permissions do novo profile.
-- Coexiste com a coluna rh_permissions (legacy FT-8); Fase 5 dropa a antiga.

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS screen_permissions jsonb;

COMMENT ON COLUMN public.invites.screen_permissions IS
  'Snapshot dos toggles por tela (screen.action: boolean) pre-configurados '
  'no convite. Aplicado em user_screen_permissions ao aceitar. Usa o mesmo '
  'shape de user_screen_permissions.permissions.';
