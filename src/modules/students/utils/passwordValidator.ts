/**
 * Valida una contraseña según la política M365:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 */
export function validatePassword (password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula')
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function getPasswordRules () {
  return [
    (v: string) => !!v || 'La contraseña es requerida',
    (v: string) => v.length >= 8 || 'Mínimo 8 caracteres',
    (v: string) => /[A-Z]/.test(v) || 'Debe contener al menos una mayúscula',
    (v: string) => /[a-z]/.test(v) || 'Debe contener al menos una minúscula',
    (v: string) => /\d/.test(v) || 'Debe contener al menos un número',
  ]
}
