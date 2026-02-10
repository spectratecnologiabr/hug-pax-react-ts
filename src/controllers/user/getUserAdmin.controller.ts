import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getUserAdmin(userId: number) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return response.data?.data ?? response.data
}

