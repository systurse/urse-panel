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

  if (meta.requiresAdministrator && !evaluator.hasRole('administrator')) {
    return false
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
