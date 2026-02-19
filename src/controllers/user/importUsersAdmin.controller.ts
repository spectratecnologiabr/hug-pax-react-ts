import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface IImportUsersAdminPayload {
  users: Record<string, unknown>[]
}

export interface IImportUsersAdminResultItem {
  row: number
  email: string | null
  success: boolean
  userId?: number
  message?: string
}

export interface IImportUsersAdminResponse {
  summary: {
    total: number
    created: number
    failed: number
  }
  results: IImportUsersAdminResultItem[]
}

export async function importUsersAdmin(payload: IImportUsersAdminPayload) {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/admin/users/import`, payload, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return (response.data?.data ?? response.data) as IImportUsersAdminResponse
}
