import { httpClient } from '@/services/http'

const MAIL_API = '/api/v1/mail'

export interface MailItem {
  id: number
  to: string
  subject: string
  body: string
  preview: string
  sent_at: string
  status: string
}

export interface MailListResponse {
  data: MailItem[]
  current_page: number
  total: number
  per_page: number
  last_page: number
}

export interface MailFilters {
  page?: number
  per_page?: number
  search?: string
}

export interface Attachment {
  id: string
  name: string
  content_type: string
  size_kb: number
  content?: string
}

export interface AttachmentsResponse {
  data: Attachment[]
}

export const mailService = {
  async getSentMails (filters: MailFilters = {}) {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.per_page) params.append('per_page', filters.per_page.toString())
    if (filters.search) params.append('search', filters.search)

    const response = await httpClient.get<MailListResponse>(
      `${MAIL_API}/sent?${params.toString()}`,
    )
    return response
  },

  async getAttachments (messageId: number) {
    const response = await httpClient.get<AttachmentsResponse>(
      `${MAIL_API}/sent/${messageId}/attachments`,
    )
    return response.data
  },

  async downloadAttachment (messageId: number, attachmentId: string) {
    const url = `${import.meta.env.VITE_API_URL}${MAIL_API}/sent/${messageId}/attachments/${attachmentId}/download`
    window.open(url, '_blank')
  },
}
