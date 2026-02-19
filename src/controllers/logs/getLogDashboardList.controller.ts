import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface ILogDashboardListQuery {
  search?: string
  q?: string
  from?: string
  to?: string
  dateFrom?: string
  dateTo?: string
  module?: string
  level?: string
  page?: number
  limit?: number
  userId?: number
}

export async function getLogDashboardList(query: ILogDashboardListQuery = {}) {
  const params = {
    q: query.q ?? query.search,
    dateFrom: query.dateFrom ?? query.from,
    dateTo: query.dateTo ?? query.to,
    module: query.module,
    level: query.level,
    page: query.page,
    limit: query.limit,
    userId: query.userId,
  }

  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/list`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params,
  })

  return response.data?.data ?? response.data
}
