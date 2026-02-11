import axios from "axios"
import { getCookies } from "../misc/cookies.controller"
import type { AdminUserRole } from "./listUsersAdmin.controller"

export interface ICreateUserAdminData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: AdminUserRole
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
  management?: string | null
}

export async function createUserAdmin(data: ICreateUserAdminData) {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/admin/users`, data, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return response.data?.data ?? response.data
}
