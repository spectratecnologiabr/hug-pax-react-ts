import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getAdminDashboardMetrics() {
  const apiUrl = process.env.REACT_APP_API_URL
  const token = getCookies("authToken")

  if (!apiUrl) throw new Error("Missing REACT_APP_API_URL")

  const urls = [
    `${apiUrl}/user/admin/dashboard-widgets`,
    `${apiUrl}/dashboard/admin/overview`,
    `${apiUrl}/dashboard/overview`,
  ]

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) continue
      throw error
    }
  }

  throw new Error("No dashboard widgets endpoint found")
}
