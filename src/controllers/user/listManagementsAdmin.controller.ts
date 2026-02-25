import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function listManagementsAdmin() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/managements`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  const payload = response.data?.data ?? response.data
  return Array.isArray(payload) ? payload.map((value) => String(value).trim()).filter(Boolean) : []
}
