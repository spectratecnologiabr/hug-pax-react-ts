import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export type AdminUserRole = "admin" | "educator" | "consultant" | "coordinator"
export type AdminUserStatus = "active" | "inactive" | "blocked"

export interface IListUsersAdminQuery {
  search?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  page?: number
  limit?: number
}

export interface IAdminUserListItem {
  id: number
  firstName?: string
  lastName?: string
  name?: string
  email: string
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
  collegeName?: string
  lastAccessAt?: string | null
}

export function resolveAdminUserStatus(user: Pick<IAdminUserListItem, "isActive" | "isBlocked">): AdminUserStatus {
  if (user.isBlocked) return "blocked"
  if (user.isActive) return "active"
  return "inactive"
}

export async function listUsersAdmin(query: IListUsersAdminQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/users`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  })

  return response.data?.data ?? response.data
}
