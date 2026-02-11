import axios from "axios"
import { getCookies } from "../misc/cookies.controller"
import type { ILogDashboardListQuery } from "./getLogDashboardList.controller"

export async function exportLogDashboardCsv(query: ILogDashboardListQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/export/csv`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
    responseType: "blob",
  })

  return response.data as Blob
}
