import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export type AdminUserRole = "admin" | "educator" | "consultant" | "coordinator"
export type AdminUserStatus = "active" | "inactive" | "blocked"

export interface IListUsersAdminQuery {
  search?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  management?: string
  page?: number
  limit?: number
  pageSize?: number
  sortBy?: "name" | "created_at"
  sortDir?: "asc" | "desc"
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
  vacationMode?: boolean
  vacationMessage?: string | null
  vacationStartAt?: string | null
  vacationEndAt?: string | null
  docType?: string
  docId?: string
  birthDate?: string
  gender?: string
  profilePic?: string
  phone?: string
  language?: string
  collegeId?: number | null
  collegeName?: string
  createdAt?: string | null
  lastAccessAt?: string | null
  updatedAt?: string | null
  management?: string | null
}

export function resolveAdminUserStatus(user: Pick<IAdminUserListItem, "isActive" | "isBlocked">): AdminUserStatus {
  if (user.isBlocked) return "blocked"
  if (user.isActive) return "active"
  return "inactive"
}

export async function listUsersAdmin(query: IListUsersAdminQuery = {}) {
  const params = {
    search: query.search,
    role: query.role,
    status: query.status,
    management: query.management,
    page: query.page,
    pageSize: query.pageSize ?? query.limit,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
  }

  const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/admin/users`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params,
  })

  return response.data?.data ?? response.data
}
