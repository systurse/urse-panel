import { toRef } from 'vue'
import { useMailStore } from '../states/mailStore'

export function useMail () {
  const store = useMailStore()

  return {
    mails: toRef(store, 'mails'),
    attachments: toRef(store, 'attachments'),
    loading: toRef(store, 'loading'),
    attachmentsLoading: toRef(store, 'attachmentsLoading'),
    error: toRef(store, 'error'),
    currentPage: toRef(store, 'currentPage'),
    totalPages: toRef(store, 'totalPages'),
    totalMails: toRef(store, 'totalMails'),
    perPage: toRef(store, 'perPage'),
    fetchSentMails: store.fetchSentMails,
    fetchAttachments: store.fetchAttachments,
    downloadAttachment: store.downloadAttachment,
    clearError: store.clearError,
  }
}
