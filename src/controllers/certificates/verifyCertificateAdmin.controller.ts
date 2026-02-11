import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export type TCertificateDocument = {
  certificateCode: string
  userName: string
  courseTitle: string
  hours: number
  issuedAt: string
  modules: Array<string>
}

export async function verifyCertificateAdmin(query: string): Promise<TCertificateDocument> {
  const apiUrl = process.env.REACT_APP_API_URL
  const token = getCookies("authToken")

  if (!apiUrl) throw new Error("Missing REACT_APP_API_URL")

  const q = query.trim()
  if (!q) throw new Error("Missing query")

  const urls = [
    `${apiUrl}/certificates/document/${encodeURIComponent(q)}`,
    `${apiUrl}/certificates/admin/document/${encodeURIComponent(q)}`,
    `${apiUrl}/certificates/admin/verify/${encodeURIComponent(q)}`,
    `${apiUrl}/certificates/verify/${encodeURIComponent(q)}`,
  ]

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return (response.data?.data ?? response.data) as TCertificateDocument
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) continue
      throw error
    }
  }

  throw new Error("No certificate verify endpoint found")
}

