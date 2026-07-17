import { defineStore } from 'pinia'
import { ref } from 'vue'
import { mailService, type MailItem, type MailFilters, type Attachment } from '../services/mailService'

export const useMailStore = defineStore('mail', () => {
  const mails = ref<MailItem[]>([])
  const attachments = ref<Attachment[]>([])
  const loading = ref(false)
  const attachmentsLoading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalMails = ref(0)
  const perPage = ref(20)

  const fetchSentMails = async (filters: MailFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await mailService.getSentMails(filters)
      mails.value = response.data
      currentPage.value = response.current_page
      totalPages.value = response.last_page
      totalMails.value = response.total
      perPage.value = response.per_page
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cargar correos'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAttachments = async (messageId: number) => {
    attachmentsLoading.value = true
    error.value = null

    try {
      const response = await mailService.getAttachments(messageId)
      attachments.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Error al cargar adjuntos'
      throw err
    } finally {
      attachmentsLoading.value = false
    }
  }

  const downloadAttachment = (messageId: number, attachmentId: string) => {
    mailService.downloadAttachment(messageId, attachmentId)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    mails,
    attachments,
    loading,
    attachmentsLoading,
    error,
    currentPage,
    totalPages,
    totalMails,
    perPage,
    fetchSentMails,
    fetchAttachments,
    downloadAttachment,
    clearError,
  }
})
