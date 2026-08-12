import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdministrationStore = defineStore('administracion', () => {
  const sections = ref([
    {
      title: 'Usuarios',
      description: 'Alta, edición y control del acceso de usuarios del panel.',
      to: '/administracion/usuarios',
      icon: 'mdi-account-group-outline',
    },
    {
      title: 'Roles',
      description: 'Definición de roles funcionales y su alcance dentro del sistema.',
      to: '/administracion/roles',
      icon: 'mdi-shield-account-outline',
    },
    {
      title: 'Permisos',
      description: 'Consulta de permisos disponibles para cada capacidad del sistema.',
      to: '/administracion/permisos',
      icon: 'mdi-lock-outline',
    },
    {
      title: 'Áreas',
      description: 'Jerarquía de direcciones, coordinaciones y departamentos, y sus encargados.',
      to: '/administracion/areas',
      icon: 'mdi-sitemap-outline',
    },
    {
      title: 'Empleados',
      description: 'Alta, edición y ficha de los empleados registrados en el sistema.',
      to: '/administracion/empleados',
      icon: 'mdi-account-hard-hat-outline',
    },
  ])

  return {
    sections,
  }
})
