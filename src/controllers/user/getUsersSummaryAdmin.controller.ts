import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface IUsersSummaryAdmin {
  total: number
  active: number
  inactive: number
  blocked: number
}

export interface IUsersSummaryAdminQuery {
  search?: string
  role?: "admin" | "educator" | "consultant" | "coordinator"
  management?: string
}

export async function getUsersSummaryAdmin(query: IUsersSummaryAdminQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/stats`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: {
      search: query.search,
      role: query.role,
      management: query.management,
    },
  })

  return (response.data?.data ?? response.data) as IUsersSummaryAdmin
}
