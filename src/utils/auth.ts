const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrador',
  administrative: 'Administrativo',
  teacher: 'Docente',
  student: 'Estudiante',
}

export function formatRoleLabel (role?: string | null) {
  if (!role) {
    return 'Sin rol'
  }

  return ROLE_LABELS[role] ?? role
}

/**
 * A student account carries the `student` role and nothing else. Anyone who
 * also holds a staff role keeps the staff portal, so a single stray `student`
 * assignment never hides the modules from an administrator.
 */
export function isStudentOnly (roles: readonly string[]) {
  return roles.length > 0 && roles.every(role => role === 'student')
}
