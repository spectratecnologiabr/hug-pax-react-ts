import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ICertificatesSummaryAdmin {
  valid: number
  totalIssued: number
  frauds: number
}

export async function getCertificatesSummaryAdmin(): Promise<ICertificatesSummaryAdmin> {
  const apiUrl = process.env.REACT_APP_API_URL
  const token = getCookies("authToken")

  if (!apiUrl) throw new Error("Missing REACT_APP_API_URL")

  const urls = [
    `${apiUrl}/certificates/admin/stats`,
    `${apiUrl}/certificates/admin/summary`,
    `${apiUrl}/dashboard/certificates/overview`,
    `${apiUrl}/dashboard/certificates/widgets`,
  ]

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = response.data?.data ?? response.data
      return payload as ICertificatesSummaryAdmin
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) continue
      throw error
    }
  }

  throw new Error("No certificates summary endpoint found")
}

