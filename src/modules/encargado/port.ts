export interface SshKeyInfo {
  fingerprint: string | null
}

export interface EncargadoPort {
  fetchKey: () => Promise<SshKeyInfo | null>
  storeKey: (privateKey: string) => Promise<SshKeyInfo>
  deleteKey: () => Promise<void>
}
