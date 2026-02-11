import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ILogDashboardListQuery {
  search?: string
  from?: string
  to?: string
  module?: string
  level?: string
  limit?: number
}

export async function getLogDashboardList(query: ILogDashboardListQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/list`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  })

  return response.data?.data ?? response.data
}
