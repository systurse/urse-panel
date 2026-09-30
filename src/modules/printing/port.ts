export interface PrintingCampus {
  key: string
  label: string
}

export interface PrintingFile {
  id: string
  batchCode: string
  originalName: string
  extension: string
  mimeType: string
  sizeBytes: number
  campus: string
  campusLabel: string
  canPreviewInline: boolean
  uploadedAt: string
  expiresAt: string
  remainingSeconds: number
  printedAt: string | null
  printedBy: string | null
}

export interface PrintingFilesQuery {
  page?: number
  perPage?: number
}

export interface PrintingFilesPagination {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export interface PaginatedPrintingFiles {
  items: PrintingFile[]
  meta: PrintingFilesPagination
}

export interface PrintingUploadedFile {
  originalName: string
  sizeBytes: number
}

export interface PrintingUploadResult {
  batchCode: string
  campus: string
  expiresInMinutes: number
  files: PrintingUploadedFile[]
}

export type PrintingStreamMode = 'download' | 'inline'

export interface PrintingStream {
  blob: Blob
  contentType: string
}

export interface PrintingPort {
  /** Public, no session: uploads the files scanned off the QR. */
  uploadFiles: (files: File[]) => Promise<PrintingUploadResult>

  /** Campus tabs the signed-in operator is allowed to see. */
  listCampuses: () => Promise<PrintingCampus[]>

  listFiles: (query?: PrintingFilesQuery) => Promise<PaginatedPrintingFiles>

  /** Goes through the authenticated client: the binary needs the Bearer token, a plain link would not carry it. */
  getStream: (fileId: string, mode?: PrintingStreamMode) => Promise<PrintingStream>

  markPrinted: (fileId: string) => Promise<PrintingFile>

  remove: (fileId: string) => Promise<void>

  getOperatorCampuses: (userId: number | string) => Promise<string[]>

  setOperatorCampuses: (userId: number | string, campuses: string[]) => Promise<string[]>
}
