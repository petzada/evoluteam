// Actors fixtures para testes de visibilidade. Compatíveis com CanDoActor
// (mesmo formato que a Sidebar usa em isItemVisible).

import type { CanDoActor } from '@/features/permissions/permissions';

export const adminActor: CanDoActor = {
  role: 'admin_rh',
  screenPermissions: null, // admin nao usa toggles — bypass em canDo
};

export const directorActor: CanDoActor = {
  role: 'director',
  screenPermissions: null,
};

export const userPuroActor: CanDoActor = {
  role: 'user',
  screenPermissions: {}, // sem nenhum toggle extra
};

export const userComToggleCandidatosActor: CanDoActor = {
  role: 'user',
  screenPermissions: {
    'recrutamento_candidatos.view': true,
  },
};
