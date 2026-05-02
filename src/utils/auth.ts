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
