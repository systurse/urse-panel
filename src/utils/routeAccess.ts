import type { RouteMeta } from 'vue-router'

interface AccessEvaluator {
  hasAnyPermission: (permissions: string[]) => boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export function canAccessRouteMeta (meta: RouteMeta | undefined, evaluator: AccessEvaluator) {
  if (!meta) {
    return true
  }

  const isAdministrator = evaluator.hasRole('administrator')

  if (meta.requiresAdministrator && !isAdministrator) {
    return false
  }

  // The administrator role stands in for any permission requirement. The SSM
  // sidebar already gates its entries as `isAdmin || hasPermission(...)`, so
  // without this an administrator was shown menu items the guard then bounced.
  if (isAdministrator) {
    return true
  }

  // Roles listed here grant access on their own. Every other key below is a
  // requirement that must hold; this one is an alternative to them, which is
  // how a route can be opened to a whole role without also handing that role
  // the individual permissions.
  if (
    Array.isArray(meta.grantedToRoles)
    && meta.grantedToRoles.some(role => typeof role === 'string' && evaluator.hasRole(role))
  ) {
    return true
  }

  if (
    Array.isArray(meta.requiresAnyPermission)
    && meta.requiresAnyPermission.length > 0
    && !evaluator.hasAnyPermission(meta.requiresAnyPermission)
  ) {
    return false
  }

  if (Array.isArray(meta.requiresAllPermissions) && meta.requiresAllPermissions.length > 0) {
    const hasAll = meta.requiresAllPermissions.every(permission => evaluator.hasPermission(permission))
    if (!hasAll) {
      return false
    }
  }

  return true
}
