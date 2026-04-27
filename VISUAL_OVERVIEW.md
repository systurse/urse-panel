# Vista Visual de la Interfaz de Módulos

## 🏠 Página Principal (Home - `/`)

```
┌────────────────────────────────────────────────────────────────┐
│  🏛️  Logo URSE                              👤 Menú Usuario    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│              📱 Bienvenido al Portal URSE                      │
│              Selecciona un módulo para comenzar                │
│                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  │                  │ │                  │ │                  │
│  │ 💻 SACC          │ │ 🔧 SSM           │ │ 📋 SPS           │
│  │                  │ │                  │ │                  │
│  │ Apartados        │ │ Servicios y      │ │ Permisos de      │
│  │ Centro Cómputo   │ │ Mantenimiento    │ │ Salida           │
│  │                  │ │                  │ │                  │
│  │ ✓ Reservas       │ │ ✓ Órdenes        │ │ ✓ Solicitudes    │
│  │ ✓ Equipos        │ │ ✓ Programación   │ │ ✓ Autorizaciones │
│  │ ✓ Reportes       │ │ ✓ Seguimiento    │ │ ✓ Historial      │
│  │                  │ │                  │ │                  │
│  │ → Acceder        │ │ → Acceder        │ │ → Acceder        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Características:
- ✨ **Sin Sidebar** - Enfoque total en seleccionar módulo
- 🎨 **Colores institucionales** - Amarillo (#FAB21A) y Negro (#000000)
- 📱 **Responsive** - 3 columnas (desktop) → 2 (tablet) → 1 (móvil)
- ⚡ **Interactivo** - Hover con elevación y sombra
- 🔗 **Links navegables** - Cada tarjeta enlaza a `/sacc`, `/ssm`, `/sps`

---

## 📊 Página de Módulo Ejemplo (SACC - `/sacc`)

```
┌─────────────────────────────────┬───────────────────────────────────┐
│ ☰ SACC                  🏠 │    Reportes  📊                         │
├─────────────────────────────────┼───────────────────────────────────┤
│                                 │                                   │
│ Sidebar                         │ 💻 SACC                           │
│ (Menú de opciones)              │ Sistema de Apartado del Centro    │
│                                 │ de Cómputo                        │
│ • Inicio                        │                                   │
│ • Crear Ticket                  │  Estadísticas Rápidas:            │
│ • Reportes                      │ ┌────────┬────────┬────────────┐ │
│ • Campos                        │ │Reservas│Equipos │Mantenimiento│
│ • Formularios                   │ │  12    │  28    │     3      │ │
│ • Usuarios                      │ └────────┴────────┴────────────┘ │
│ • Roles                         │                                   │
│ • Permisos                      │  ┌──────────────────────────────┐ │
│ • Configuración                 │  │                              │ │
│                                 │  │  Módulo en desarrollo...     │ │
│                                 │  │                              │ │
│                                 │  │  Las funcionalidades del     │ │
│                                 │  │  SACC estarán disponibles    │ │
│                                 │  │  pronto.                     │ │
│                                 │  │                              │ │
│                                 │  └──────────────────────────────┘ │
│                                 │                                   │
└─────────────────────────────────┴───────────────────────────────────┘
```

### Características:
- 📍 **Con Sidebar** - Acceso a opciones de administración
- 📈 **Estadísticas** - Widget de estadísticas rápidas por módulo
- 🎯 **Estructura base** - Lista para agregar componentes
- 🔐 **Navegación contextual** - El sidebar se adapta al módulo

---

## 🗂️ Estructura de Módulos

Cada módulo tiene esta estructura interna:

```
sacc/
├── 🎨 components/         ← Componentes Vue específicos
│   ├── ReservationCard.vue
│   └── index.ts
├── 🪝 hooks/              ← Composables (lógica)
│   ├── useSACC.ts         ← Hook principal
│   └── index.ts
├── 📚 lib/                ← Funciones de negocio
│   └── index.ts
├── 🌐 services/           ← Llamadas a API
│   ├── saccService.ts
│   └── index.ts
├── 💾 states/             ← Stores de Pinia
│   ├── saccStore.ts
│   └── index.ts
└── 🛠️ utils/              ← Utilidades
    └── index.ts
```

---

## 🔄 Flujo de Datos por Módulo

```
┌────────────────────────────────────────────────────────────┐
│                    Vue Component                           │
│                   (Página/Vista)                           │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   Hook: useSACC()            │
        │ (Composable)                 │
        │                              │
        │ - onMounted()                │
        │ - computed properties        │
        │ - reactive logic             │
        └──────────────┬───────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │  Store: useSACCStore         │
        │  (Pinia State)               │
        │                              │
        │ - reservations               │
        │ - loading                    │
        │ - fetchReservations()        │
        └──────────────┬───────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │  Service: saccService        │
        │  (API Methods)               │
        │                              │
        │ - getReservations()          │
        │ - createReservation(data)    │
        │ - updateReservation(id)      │
        │ - deleteReservation(id)      │
        └──────────────┬───────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │   HTTP Client (Axios)        │
        │   Backend API                │
        │                              │
        │   GET /api/sacc/reservaciones│
        │   POST /api/sacc/reservaciones
        │   PUT /api/sacc/reservaciones/{id}
        │   DELETE ...                 │
        └──────────────────────────────┘
```

---

## 🎨 Paleta de Colores

### Colores Institucionales
```
Primario:   #FAB21A  ████████ (Amarillo)
Secundario: #000000  ████████ (Negro)
Neutral:    #5e5e5e  ████████ (Gris oscuro)
Fondo:      #f7f7f7  ████████ (Gris claro)
```

### Uso en la interfaz
- **Primario (#FAB21A)**: Iconos, acentos, CTA buttons
- **Secundario (#000000)**: Textos principales, encabezados
- **Neutral**: Textos secundarios, descripciones
- **Fondo**: Backgrounds de tarjetas y secciones

---

## 📱 Responsividad

### Desktop (> 1200px)
```
┌─────────────────────────────────────────────────────┐
│           3 tarjetas por fila (módulos)              │
│  [SACC]        [SSM]        [SPS]                    │
└─────────────────────────────────────────────────────┘
```

### Tablet (768px - 1200px)
```
┌──────────────────────┐
│   2 tarjetas por fila│
│  [SACC]    [SSM]     │
│           [SPS]      │
└──────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────┐
│ 1 tarjeta    │
│   [SACC]     │
│   [SSM]      │
│   [SPS]      │
└──────────────┘
```

---

## ✨ Efectos y Animaciones

### Tarjetas de Módulos
- **Hover**: Elevación (translateY -8px) + sombra
- **Transición**: 0.3s ease
- **Border**: Sutil cambio de color en hover

### Formularios (Futuros)
- **Validación**: Feedback inmediato
- **Carga**: Loading spinners
- **Éxito/Error**: Notificaciones elegantes

---

## 🚀 Integración

Para agregar nueva funcionalidad:

1. **Servicio** → `modules/[modulo]/services/`
2. **Store** → `modules/[modulo]/states/`
3. **Hook** → `modules/[modulo]/hooks/`
4. **Componente** → `modules/[modulo]/components/`
5. **Vista** → Importar en página y usar

Ejemplo:
```vue
<script setup>
import { useSACC } from '@/modules/sacc/hooks/useSACC'
import ReservationCard from '@/modules/sacc/components/ReservationCard.vue'

const { reservations, loading } = useSACC()
</script>

<template>
  <ReservationCard 
    v-for="res in reservations" 
    :key="res.id" 
    :reservation="res" 
  />
</template>
```

---

**Status**: ✅ Completado y listo para desarrollo
