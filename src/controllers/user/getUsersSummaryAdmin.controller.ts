import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface IUsersSummaryAdmin {
  total: number
  active: number
  inactive: number
  blocked: number
}

export async function getUsersSummaryAdmin() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/stats`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return (response.data?.data ?? response.data) as IUsersSummaryAdmin
}

