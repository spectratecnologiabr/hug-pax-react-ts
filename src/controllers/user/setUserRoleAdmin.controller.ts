import axios from "axios"
import { getCookies } from "../misc/cookies.controller"
import type { AdminUserRole } from "./listUsersAdmin.controller"

export async function setUserRoleAdmin(userId: number, role: AdminUserRole) {
  const response = await axios.patch(
    `${process.env.REACT_APP_API_URL}/user/admin/users/${userId}/role`,
    { role },
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )

  return response.data?.data ?? response.data
}

