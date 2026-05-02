import type { EncargadoPort, SshKeyInfo } from '@/modules/encargado/port'
import type { HttpClient } from '@/services/http'
import { httpClient } from '@/services/http'

interface KeyStatusResponse {
  has_key: boolean
  fingerprint?: string | null
}

interface StoreKeyResponse {
  fingerprint?: string
}

export class HttpEncargadoAdapter implements EncargadoPort {
  constructor (private readonly client: HttpClient) {}

  async fetchKey (): Promise<SshKeyInfo | null> {
    const response = await this.client.get<KeyStatusResponse>('/api/v1/encargado/key')
    if (!response.has_key) return null
    return { fingerprint: response.fingerprint ?? null }
  }

  async storeKey (privateKey: string): Promise<SshKeyInfo> {
    const response = await this.client.post<StoreKeyResponse, { private_key: string }>('/api/v1/encargado/key', {
      private_key: privateKey,
    })

    return {
      fingerprint: response.fingerprint ?? null,
    }
  }

  async deleteKey () {
    await this.client.delete<unknown>('/api/v1/encargado/key')
  }
}

export const encargadoAdapter = new HttpEncargadoAdapter(httpClient)
