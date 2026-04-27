# Arquitectura de Módulos - Screaming Architecture

Este proyecto sigue el patrón de **Screaming Architecture** donde la estructura del proyecto comunica el propósito del negocio claramente.

## Estructura de Carpetas

```
modules/
├── core/                 # Utilidades compartidas entre módulos
│   ├── components/       # Componentes reutilizables
│   ├── hooks/           # Composables compartidos
│   ├── lib/             # Librerías de utilidad
│   ├── services/        # Servicios compartidos
│   ├── states/          # Stores de Pinia compartidas
│   └── utils/           # Funciones de utilidad
│
├── auth/                # Sistema de autenticación (existente)
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── states/
│   └── utils/
│
├── sacc/                # SACC - Sistema de Apartado del Centro de Cómputo
│   ├── components/      # Componentes específicos de SACC
│   ├── hooks/          # useSACC() - hook principal del módulo
│   ├── lib/            # Lógica de negocio de SACC
│   ├── services/       # saccService - llamadas a API
│   ├── states/         # useSACCStore - estado global de SACC
│   └── utils/          # Utilidades específicas de SACC
│
├── ssm/                 # SSM - Sistema de Servicios y Mantenimiento
│   ├── components/
│   ├── hooks/          # useSSM() - hook principal del módulo
│   ├── lib/
│   ├── services/       # ssmService - llamadas a API
│   ├── states/         # useSSMStore - estado global de SSM
│   └── utils/
│
└── sps/                 # SPS - Sistema de Permisos de Salida
    ├── components/
    ├── hooks/          # useSPS() - hook principal del módulo
    ├── lib/
    ├── services/       # spsService - llamadas a API
    ├── states/         # useSPSStore - estado global de SPS
    └── utils/
```

## Cómo usar cada módulo

### 1. Estados (Stores)

Cada módulo tiene su propio store con Pinia:

```typescript
// En src/modules/sacc/states/saccStore.ts
import { defineStore } from 'pinia'

export const useSACCStore = defineStore('sacc', () => {
  const reservations = ref([])
  const fetchReservations = async () => { /* ... */ }
  return { reservations, fetchReservations }
})
```

### 2. Servicios (API)

Contienen las llamadas HTTP a la API:

```typescript
// En src/modules/sacc/services/saccService.ts
export const saccService = {
  async getReservations() { /* ... */ },
  async createReservation(data) { /* ... */ },
  // más métodos...
}
```

### 3. Hooks (Composables)

Abstraen la lógica de un módulo para usar en componentes:

```typescript
// En src/modules/sacc/hooks/useSACC.ts
export function useSACC() {
  const store = useSACCStore()
  onMounted(() => store.fetchReservations())
  return { reservations: store.reservations, ... }
}
```

### 4. Componentes

Componentes reutilizables específicos del módulo:

```vue
<!-- En src/modules/sacc/components/ReservationCard.vue -->
<template>
  <v-card><!-- ... --></v-card>
</template>
```

## Flujo de datos típico

```
Vue Component
    ↓
Hook (useSACC)
    ↓
Store (useSACCStore)
    ↓
Service (saccService)
    ↓
HTTP Client
    ↓
Backend API
```

## Rutas

- `/` - Página de módulos (sin sidebar)
- `/sacc` - Módulo SACC (con sidebar)
- `/ssm` - Módulo SSM (con sidebar)
- `/sps` - Módulo SPS (con sidebar)

## Añadir funcionalidad a un módulo

1. **Crear un servicio** en `modules/[modulo]/services/`
2. **Crear un store** en `modules/[modulo]/states/`
3. **Crear un hook** en `modules/[modulo]/hooks/`
4. **Crear componentes** en `modules/[modulo]/components/`
5. **Usar en páginas** importando el hook

Ejemplo:

```vue
<script setup>
import { useSACC } from '@/modules/sacc/hooks/useSACC'

const { reservations, loading } = useSACC()
</script>
```

## Mejor práctica

- Cada módulo es independiente
- Los datos fluyen unidireccionalmente
- Los servicios son el único puente con la API
- Los stores manejan el estado
- Los hooks abstraen la complejidad
- Los componentes son presentacionales
