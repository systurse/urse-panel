import type { RouteMeta } from 'vue-router'

/**
 * The agenda is for directors (rector, general and school directors) and for
 * Academic Affairs, which coordinates it. Both roles are assigned from the
 * agenda's own directors screen; `agenda.view` covers anyone the roles screen
 * hands it to directly. The administrator gets through regardless.
 */
const DIRECTOR_ROLE = 'agenda_director'
const COORDINATOR_ROLE = 'agenda_coordinator'

export const AGENDA_META: RouteMeta = {
  grantedToRoles: [DIRECTOR_ROLE, COORDINATOR_ROLE],
  requiresAnyPermission: ['agenda.view'],
}

export const AGENDA_SPACES_META: RouteMeta = {
  grantedToRoles: [COORDINATOR_ROLE],
  requiresAnyPermission: ['agenda.spaces.manage'],
}

export const AGENDA_DIRECTORS_META: RouteMeta = {
  grantedToRoles: [COORDINATOR_ROLE],
  requiresAnyPermission: ['agenda.directors.manage'],
}
