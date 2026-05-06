/// <reference types="vite/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />
import 'vue-router'

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAllPermissions?: string[]
    requiresAnyPermission?: string[]
    requiresAdministrator?: boolean
  }
}
