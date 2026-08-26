import type {
  ExitPassSignature,
  ExitPassSignaturesPort,
  OtpRequestResult,
  PublicSignatureSummary,
  PublicVerification,
  SignatureCollection,
  SignatureEvidence,
  SignatureProgress,
  SignerRole,
  SignPayload,
  SignResult,
  VerificationStatus,
} from '@/modules/exit-pass-signatures/port'
import type { HttpClient } from '@/services/http'
import { httpClient, publicHttpClient } from '@/services/http'

type ApiRecord = Record<string, unknown>

const SIGNER_ROLES = new Set<string>(['administrative_director', 'employee', 'immediate_supervisor'])
const VERIFICATION_STATUSES = new Set<string>(['altered', 'incomplete', 'valid'])

function asRecord (value: unknown): ApiRecord {
  return value && typeof value === 'object' ? value as ApiRecord : {}
}

function readString (source: ApiRecord, key: string): string {
  const value = source[key]
  return typeof value === 'string' ? value : ''
}

function readNullableString (source: ApiRecord, key: string): string | null {
  const value = source[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function readBoolean (source: ApiRecord, key: string): boolean {
  return source[key] === true
}

function readSignerRole (value: unknown): SignerRole {
  return typeof value === 'string' && SIGNER_ROLES.has(value) ? value as SignerRole : 'employee'
}

function readSignerRoles (value: unknown): SignerRole[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string' && SIGNER_ROLES.has(entry))
    .map(entry => entry as SignerRole)
}

// Responses arrive either bare or wrapped in Laravel's `data` envelope.
function unwrapData (response: unknown): unknown {
  const record = asRecord(response)
  return 'data' in record ? record.data : response
}

function mapSignature (raw: unknown): ExitPassSignature {
  const item = asRecord(raw)
  const id = item.id

  return {
    documentHash: readString(item, 'document_hash'),
    id: typeof id === 'number' || typeof id === 'string' ? id : '',
    revokedAt: readNullableString(item, 'revoked_at'),
    role: readSignerRole(item.role),
    roleLabel: readString(item, 'role_label'),
    signedAt: readString(item, 'signed_at'),
    signerName: readString(item, 'signer_name'),
    verificationCode: readString(item, 'verification_code'),
  }
}

function mapProgress (raw: unknown): SignatureProgress {
  const item = asRecord(raw)

  return {
    documentHash: readString(item, 'document_hash'),
    isComplete: readBoolean(item, 'is_complete'),
    pendingRoles: readSignerRoles(item.pending_roles),
    requiredRoles: readSignerRoles(item.required_roles),
    signedRoles: readSignerRoles(item.signed_roles),
  }
}

function mapProgressFromMeta (response: unknown): SignatureProgress {
  return mapProgress(asRecord(asRecord(response).meta).signature_progress)
}

function mapPublicSignature (raw: unknown): PublicSignatureSummary {
  const item = asRecord(raw)

  return {
    method: readString(item, 'method'),
    role: readSignerRole(item.role),
    roleLabel: readString(item, 'role_label'),
    signedAt: readString(item, 'signed_at'),
    signerDisplay: readString(item, 'signer_display'),
  }
}

function mapVerification (response: unknown): PublicVerification {
  const item = asRecord(unwrapData(response))
  const document = asRecord(item.document)
  const integrity = asRecord(item.integrity)
  const folio = document.folio
  const status = item.status

  return {
    document: {
      folio: typeof folio === 'number' || typeof folio === 'string' ? folio : '',
      issuedOn: readString(document, 'issued_on'),
      type: readString(document, 'type'),
    },
    documentHash: readString(item, 'document_hash'),
    integrity: {
      contentUnchanged: readBoolean(integrity, 'content_unchanged'),
      evidenceUnchanged: readBoolean(integrity, 'evidence_unchanged'),
    },
    message: readString(item, 'message'),
    signatures: Array.isArray(item.signatures) ? item.signatures.map(entry => mapPublicSignature(entry)) : [],
    // An unknown status must not read as valid; `altered` is the safe default.
    status: typeof status === 'string' && VERIFICATION_STATUSES.has(status)
      ? status as VerificationStatus
      : 'altered',
    verifiedAt: readString(item, 'verified_at'),
  }
}

export class HttpExitPassSignaturesAdapter implements ExitPassSignaturesPort {
  constructor (
    private readonly client: HttpClient,
    private readonly openClient: HttpClient,
  ) {}

  async getEvidence (passId: number | string, signatureId: number | string): Promise<SignatureEvidence> {
    const response = await this.client.get<unknown>(
      `/api/v1/exit-passes/${passId}/signatures/${signatureId}/evidence`,
    )
    const item = asRecord(unwrapData(response))

    return {
      hashMatches: readBoolean(item, 'evidence_hash_matches'),
      raw: item,
    }
  }

  async list (passId: number | string): Promise<SignatureCollection> {
    const response = await this.client.get<unknown>(`/api/v1/exit-passes/${passId}/signatures`)
    const data = unwrapData(response)

    return {
      progress: mapProgressFromMeta(response),
      signatures: Array.isArray(data) ? data.map(entry => mapSignature(entry)) : [],
    }
  }

  async requestOtp (passId: number | string, signerRole: SignerRole): Promise<OtpRequestResult> {
    const response = await this.client.post<unknown, { signer_role: SignerRole }>(
      `/api/v1/exit-passes/${passId}/signatures/otp`,
      { signer_role: signerRole },
    )
    const item = asRecord(response)
    const expiresIn = item.expires_in

    return {
      destination: readString(item, 'destination'),
      expiresIn: typeof expiresIn === 'number' ? expiresIn : 300,
      message: readString(item, 'message'),
      signerRole: readSignerRole(item.signer_role ?? signerRole),
    }
  }

  async sign (passId: number | string, payload: SignPayload): Promise<SignResult> {
    const body: Record<string, unknown> = {
      code: payload.code,
      signer_role: payload.signerRole,
    }

    if (payload.fingerprint) {
      body.fingerprint = payload.fingerprint
    }

    if (typeof payload.fingerprintConfidence === 'number') {
      body.fingerprint_confidence = payload.fingerprintConfidence
    }

    const response = await this.client.post<unknown, Record<string, unknown>>(
      `/api/v1/exit-passes/${passId}/signatures`,
      body,
    )

    return {
      progress: mapProgressFromMeta(response),
      signature: mapSignature(unwrapData(response)),
    }
  }

  async verify (code: string): Promise<PublicVerification> {
    const response = await this.openClient.get<unknown>(
      `/api/v1/signatures/verify/${encodeURIComponent(code)}`,
    )
    return mapVerification(response)
  }
}

export const exitPassSignaturesAdapter = new HttpExitPassSignaturesAdapter(httpClient, publicHttpClient)
