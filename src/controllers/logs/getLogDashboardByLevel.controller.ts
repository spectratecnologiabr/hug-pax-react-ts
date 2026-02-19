import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ILogDashboardByLevelQuery {
  limit?: number
  from?: string
  to?: string
}

export async function getLogDashboardByLevel(level: string, query: ILogDashboardByLevelQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/level/${level}`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  })

  return response.data?.data ?? response.data
}
