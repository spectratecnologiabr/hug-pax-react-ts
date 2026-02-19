import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ILogDashboardWidgetQuery {
  limit?: number
  from?: string
  to?: string
}

export async function getLogDashboardWidget(query: ILogDashboardWidgetQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/widget`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  })

  return response.data?.data ?? response.data
}
