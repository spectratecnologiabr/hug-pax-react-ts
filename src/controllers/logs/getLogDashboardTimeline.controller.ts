import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ILogDashboardTimelineQuery {
  limit?: number
  from?: string
  to?: string
}

export async function getLogDashboardTimeline(query: ILogDashboardTimelineQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/timeline`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  })

  return response.data?.data ?? response.data
}

