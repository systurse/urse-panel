# SAE - Sistema de Administración de Estudiantes

Módulo para el registro y administración de nuevas cuentas de estudiantes con provisioning automático en M365.

## 📋 Características

- ✅ Registro de nuevos estudiantes
- ✅ Validación de contraseñas según políticas M365
- ✅ Seguimiento del estado de provisioning en tiempo real
- ✅ Generación automática de credenciales
- ✅ Interfaz intuitiva con pasos claramente definidos

## 🏗️ Estructura

```
students/
├── components/
│   ├── StudentRegistrationForm.vue      - Formulario de registro
│   ├── StudentProvisioningStatus.vue    - Timeline de provisioning
│   └── index.ts
├── hooks/
│   ├── useStudent.ts                    - Hook principal
│   └── index.ts
├── lib/
│   └── index.ts
├── services/
│   ├── studentService.ts                - Llamadas a API
│   └── index.ts
├── states/
│   ├── studentStore.ts                  - Store de Pinia
│   └── index.ts
├── utils/
│   ├── passwordValidator.ts             - Validación de contraseñas
│   └── index.ts
└── README.md (este archivo)
```

## 🔌 API Endpoints

### Registrar Estudiante
**POST** `/api/v1/students`

```json
{
  "matricula": "A123456789",
  "servo_username": "mamr",
  "name": "Maria",
  "first_last_name": "Ambriz",
  "second_last_name": "Rodriguez",
  "password": "Password1!"
}
```

**Response 202 Accepted:**
```json
{
  "student": {
    "id": 1,
    "matricula": "A123456789",
    "servo_username": "mamr",
    "name": "Maria",
    "first_last_name": "Ambriz",
    "second_last_name": "Rodriguez",
    "institutional_email": "10mamr@urse.edu.mx",
    "wifi_password": "MAMR6789",
    "status": "pending",
    "microsoft_365_id": null,
    "activated_at": null
  },
  "message": "Account provisioning started. The student account will be active within 24 hours."
}
```

### Obtener Estado del Estudiante
**GET** `/api/v1/students/{id}`

**Response 200:**
```json
{
  "id": 1,
  "matricula": "A123456789",
  "institutional_email": "10mamr@urse.edu.mx",
  "status": "pending",
  "provisioning_steps": [
    { "step": "microsoft_365",   "status": "pending",    "error": null, "completed_at": null },
    { "step": "active_directory","status": "pending",    "error": null, "completed_at": null },
    { "step": "activation",      "status": "pending",    "error": null, "completed_at": null },
    { "step": "credential_sheet","status": "pending",    "error": null, "completed_at": null }
  ]
}
```

## 🔐 Validación de Contraseña

Las contraseñas deben cumplir con la política M365:
- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula
- ✅ Al menos una minúscula
- ✅ Al menos un número

### Función de Validación

```typescript
import { validatePassword } from '@/modules/students/utils/passwordValidator'

const { valid, errors } = validatePassword('MiPassword123')
// valid: true
// errors: []

const { valid, errors } = validatePassword('weak')
// valid: false
// errors: ['La contraseña debe tener al menos 8 caracteres', ...]
```

## 🎯 Flujo de Uso

### 1. Registro de Estudiante

El usuario completa el formulario con:
- Matrícula (formato: letra + números)
- Usuario SERVO (4 letras minúsculas)
- Nombres y apellidos
- Contraseña (validada en tiempo real)

### 2. Confirmación

Después del registro exitoso, se muestra:
- Datos del alumno registrado
- Email institucional
- Contraseña WiFi (generada automáticamente)
- Estado de provisioning

### 3. Seguimiento

Se puede ver el progreso en tiempo real:
- ⏳ **Pasos pendientes** - Esperando procesamiento
- 🔄 **Procesando** - En curso
- ✅ **Completado** - Finalizado
- ❌ **Error** - Requiere atención

## 📊 Estados del Estudiante

```
pending   → Procesamiento en curso
active    → Cuenta lista para usar
suspended → Cuenta suspendida
```

## 📊 Estados de Provisioning

Cada paso de provisioning puede tener uno de estos estados:

```
pending    → En espera de procesamiento
processing → Actualmente siendo procesado
completed  → Finalizado exitosamente
failed     → Error en el proceso
```

## 🔄 Auto-Refresh

El componente de estado se actualiza automáticamente cada 5 segundos mientras el status sea `pending`.

## 💾 Store (Pinia)

```typescript
import { useStudent } from '@/modules/students/hooks/useStudent'

const {
  registeredStudent,      // Datos del último alumno registrado
  studentStatus,          // Estado de provisioning
  loading,               // Indicador de carga
  error,                 // Último error ocurrido
  registerStudent,       // Registrar nuevo alumno
  fetchStudentStatus,    // Obtener estado del alumno
  resetStudentPassword,  // Resetear contraseña
  clearError,           // Limpiar mensaje de error
} = useStudent()
```

## 🛠️ Desarrollo

### Agregar Nueva Funcionalidad

1. **Servicio** (API calls):
   ```typescript
   // modules/students/services/studentService.ts
   export const studentService = {
     async miNuevaFuncion() { ... }
   }
   ```

2. **Store** (Estado):
   ```typescript
   // modules/students/states/studentStore.ts
   const miNuevaFuncion = async () => { ... }
   ```

3. **Hook** (Composable):
   ```typescript
   // modules/students/hooks/useStudent.ts
   export function useStudent() {
     return { ..., miNuevaFuncion }
   }
   ```

4. **Componente** (UI):
   ```vue
   <!-- modules/students/components/MiComponente.vue -->
   <script setup>
   import { useStudent } from '../hooks/useStudent'
   const { miNuevaFuncion } = useStudent()
   </script>
   ```

## 📝 Notas

- El reset de contraseña está declarado en la API pero aún no está implementado en el backend
- Los tiempos de provisioning pueden variar según la carga del sistema
- Las credenciales WiFi son generadas automáticamente por el backend

## 🔗 Integración

El módulo está disponible en:
- **Ruta**: `/students`
- **Tarjeta en Home**: SAE
- **Color Institucional**: Verde (#00a86b)
- **Icono**: `mdi-account-school-outline`
