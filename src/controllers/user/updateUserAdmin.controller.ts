import axios from "axios"
import { getCookies } from "../misc/cookies.controller"
import type { AdminUserRole } from "./listUsersAdmin.controller"

export interface IUpdateUserAdminData {
  firstName?: string
  lastName?: string
  email?: string
  role?: AdminUserRole
  isActive?: boolean
  isBlocked?: boolean
  docType?: string
  docId?: string
  birthDate?: string
  gender?: string
  profilePic?: string
  phone?: string
  language?: string
  collegeId?: number | null
}

export async function updateUserAdmin(userId: number, data: IUpdateUserAdminData) {
  const response = await axios.put(`${process.env.REACT_APP_API_URL}/user/admin/users/${userId}`, data, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return response.data?.data ?? response.data
}
