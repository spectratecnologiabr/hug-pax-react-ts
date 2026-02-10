import axios from "axios"
import { getCookies } from "../misc/cookies.controller"
import type { AdminUserStatus } from "./listUsersAdmin.controller"

export async function setUserStatusAdmin(userId: number, status: AdminUserStatus) {
  const response = await axios.patch(
    `${process.env.REACT_APP_API_URL}/user/admin/users/${userId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )

  return response.data?.data ?? response.data
}

