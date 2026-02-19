import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getLogDashboardEntry(entryId: string | number) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/entry/${entryId}`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return response.data?.data ?? response.data
}
