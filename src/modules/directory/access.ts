import type { RouteMeta } from 'vue-router'

/**
 * Reading the directory only takes a session; writing it takes the
 * `directory_editor` role (which the API seeds with every `directory.*`
 * permission) or the permission itself, handed out on its own from the roles
 * screen. The administrator gets through `canAccessRouteMeta` regardless.
 */
const EDITOR_ROLE = 'directory_editor'

export const DIRECTORY_CREATE_META: RouteMeta = {
  grantedToRoles: [EDITOR_ROLE],
  requiresAnyPermission: ['directory.create'],
}

export const DIRECTORY_UPDATE_META: RouteMeta = {
  grantedToRoles: [EDITOR_ROLE],
  requiresAnyPermission: ['directory.update'],
}

export const DIRECTORY_DELETE_META: RouteMeta = {
  grantedToRoles: [EDITOR_ROLE],
  requiresAnyPermission: ['directory.delete'],
}

/** The admin screen opens for whoever can do any of the three. */
export const DIRECTORY_ADMIN_META: RouteMeta = {
  grantedToRoles: [EDITOR_ROLE],
  requiresAnyPermission: ['directory.create', 'directory.update', 'directory.delete'],
}
