/**
 * Documents that share the electronic signature subsystem. The value is the URL
 * segment the endpoints live under, so adding a format is adding a member here.
 */
export type SignableResource = 'exit-passes' | 'leave-permits'

/** Roles that can sign a document, in the order the backend requires them. */
export type SignerRole = 'administrative_director' | 'employee' | 'immediate_supervisor'

/** Result of the public verification endpoint. */
export type VerificationStatus = 'altered' | 'incomplete' | 'valid'

export interface DocumentSignature {
  documentHash: string
  id: number | string
  revokedAt: string | null
  role: SignerRole
  roleLabel: string
  signedAt: string
  signerName: string
  verificationCode: string
}

export interface SignatureProgress {
  documentHash: string
  isComplete: boolean
  pendingRoles: SignerRole[]
  requiredRoles: SignerRole[]
  signedRoles: SignerRole[]
}

export interface SignatureCollection {
  progress: SignatureProgress
  signatures: DocumentSignature[]
}

export interface OtpRequestResult {
  /** Masked mailbox, e.g. `ra************@urse.edu.mx`. Shown so the signer knows where to look. */
  destination: string
  expiresIn: number
  message: string
  signerRole: SignerRole
}

export interface SignPayload {
  code: string
  /** FingerprintJS visitorId; the API accepts it as optional evidence. */
  fingerprint?: string
  fingerprintConfidence?: number
  signerRole: SignerRole
}

export interface SignResult {
  progress: SignatureProgress
  signature: DocumentSignature
}

export interface SignatureEvidence {
  hashMatches: boolean
  raw: Record<string, unknown>
}

export interface PublicSignatureSummary {
  method: string
  role: SignerRole
  roleLabel: string
  signedAt: string
  /** Abbreviated on purpose — this endpoint is open. */
  signerDisplay: string
}

export interface PublicVerification {
  document: {
    folio: number | string
    issuedOn: string
    /** Not a constant: "Pase de salida", "Permiso", and more formats to come. */
    type: string
  }
  documentHash: string
  integrity: {
    contentUnchanged: boolean
    evidenceUnchanged: boolean
  }
  message: string
  signatures: PublicSignatureSummary[]
  status: VerificationStatus
  verifiedAt: string
}

export interface SignaturesPort {
  getEvidence: (
    resource: SignableResource,
    documentId: number | string,
    signatureId: number | string,
  ) => Promise<SignatureEvidence>
  list: (resource: SignableResource, documentId: number | string) => Promise<SignatureCollection>
  requestOtp: (
    resource: SignableResource,
    documentId: number | string,
    signerRole: SignerRole,
  ) => Promise<OtpRequestResult>
  sign: (
    resource: SignableResource,
    documentId: number | string,
    payload: SignPayload,
  ) => Promise<SignResult>
  /** Public: no token, shared by every format, used by the QR printed on the PDF. */
  verify: (code: string) => Promise<PublicVerification>
}
