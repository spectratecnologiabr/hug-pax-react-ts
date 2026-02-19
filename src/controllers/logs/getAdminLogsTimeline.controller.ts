import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface IAdminLogsTimelineQuery {
  limit?: number
  from?: string
  to?: string
}

export async function getAdminLogsTimeline(query: IAdminLogsTimelineQuery = {}) {
  const apiUrl = process.env.REACT_APP_API_URL
  const token = getCookies("authToken")

  if (!apiUrl) throw new Error("Missing REACT_APP_API_URL")

  const urls = [
    `${process.env.REACT_APP_API_URL}/dashboard/logs/widget`
  ]

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: query,
      })

      return response.data?.data ?? response.data
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) continue
      throw error
    }
  }

  throw new Error("No admin logs timeline endpoint found")
}

