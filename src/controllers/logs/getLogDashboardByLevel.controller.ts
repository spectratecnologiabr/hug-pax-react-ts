import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getLogDashboardByLevel(level: string) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/logs/level/${level}`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return response.data?.data ?? response.data
}

