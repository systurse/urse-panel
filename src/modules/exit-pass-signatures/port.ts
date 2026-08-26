/** Roles that can sign an exit pass, in the order the backend requires them. */
export type SignerRole = 'administrative_director' | 'employee' | 'immediate_supervisor'

/** Result of the public verification endpoint. */
export type VerificationStatus = 'altered' | 'incomplete' | 'valid'

export interface ExitPassSignature {
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
  signatures: ExitPassSignature[]
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
  signature: ExitPassSignature
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

export interface ExitPassSignaturesPort {
  getEvidence: (passId: number | string, signatureId: number | string) => Promise<SignatureEvidence>
  list: (passId: number | string) => Promise<SignatureCollection>
  requestOtp: (passId: number | string, signerRole: SignerRole) => Promise<OtpRequestResult>
  sign: (passId: number | string, payload: SignPayload) => Promise<SignResult>
  /** Public: no token, used by the QR printed on the PDF. */
  verify: (code: string) => Promise<PublicVerification>
}
