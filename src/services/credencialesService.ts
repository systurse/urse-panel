import { publicHttpClient } from '@/services/http'

const BASE = '/api/v1/public/students'

export interface LookupResponse {
  exists: boolean
  student_id?: number
  email_hint?: string
}

export interface SendOtpResponse {
  message: string
  expires_in: number
}

export interface StudentCredentials {
  id: number
  matricula: string
  name: string
  first_last_name: string
  second_last_name: string
  institutional_email: string
  password: string
  wifi_password: string
  career: string | { name: string; email: string; extension?: string }
}

export interface VerifyOtpResponse {
  student: StudentCredentials
}

export const credencialesService = {
  async lookup (identifier: string, recaptcha_token: string): Promise<LookupResponse> {
    return publicHttpClient.post(BASE + '/lookup', { identifier, recaptcha_token })
  },

  async sendOtp (student_id: number): Promise<SendOtpResponse> {
    return publicHttpClient.post(BASE + '/send-otp', { student_id })
  },

  async verifyOtp (student_id: number, otp: string): Promise<VerifyOtpResponse> {
    return publicHttpClient.post(BASE + '/verify-otp', { student_id, otp })
  },
}
