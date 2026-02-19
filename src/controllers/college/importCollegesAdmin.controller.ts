import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export interface IImportCollegesAdminPayload {
  colleges: Record<string, unknown>[]
}

export interface IImportCollegesAdminResultItem {
  row: number
  collegeCode: number | null
  name: string | null
  success: boolean
  collegeId?: number
  message?: string
}

export interface IImportCollegesAdminResponse {
  summary: {
    total: number
    created: number
    failed: number
  }
  results: IImportCollegesAdminResultItem[]
}

export async function importCollegesAdmin(payload: IImportCollegesAdminPayload) {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/colleges/admin/import`, payload, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  })

  return (response.data?.data ?? response.data) as IImportCollegesAdminResponse
}
