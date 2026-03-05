import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export type ImportUsersMode = "create" | "update" | "upsert"

export interface IImportUsersAdminPayload {
  users: Record<string, unknown>[]
  mode?: ImportUsersMode
}

export interface IImportUsersAdminResultItem {
  row: number
  email: string | null
  success: boolean
  action?: "created" | "updated"
  userId?: number
  message?: string
}

export interface IImportUsersAdminResponse {
  summary: {
    total: number
    created: number
    updated: number
    failed: number
  }
  results: IImportUsersAdminResultItem[]
}

const IMPORT_CHUNK_SIZE = 500

function chunkUsers(users: Record<string, unknown>[], chunkSize: number): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = []
  for (let index = 0; index < users.length; index += chunkSize) {
    chunks.push(users.slice(index, index + chunkSize))
  }
  return chunks
}

export async function importUsersAdmin(payload: IImportUsersAdminPayload) {
  const users = Array.isArray(payload?.users) ? payload.users : []
  const mode: ImportUsersMode = payload?.mode ?? "create"
  if (!users.length) {
    return {
      summary: { total: 0, created: 0, updated: 0, failed: 0 },
      results: [],
    }
  }

  const chunks = chunkUsers(users, IMPORT_CHUNK_SIZE)
  const mergedResults: IImportUsersAdminResultItem[] = []
  let totalCreated = 0
  let totalUpdated = 0
  let totalFailed = 0

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const batch = chunks[chunkIndex]
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/user/admin/users/import`,
      { users: batch, mode },
      { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
    )

    const chunkResult = (response.data?.data ?? response.data) as IImportUsersAdminResponse
    const rowOffset = chunkIndex * IMPORT_CHUNK_SIZE

    const normalizedResults = Array.isArray(chunkResult?.results)
      ? chunkResult.results.map((item) => ({
          ...item,
          row: Number(item?.row) + rowOffset,
        }))
      : []

    mergedResults.push(...normalizedResults)
    totalCreated += Number(chunkResult?.summary?.created ?? 0)
    totalUpdated += Number(chunkResult?.summary?.updated ?? 0)
    totalFailed += Number(chunkResult?.summary?.failed ?? 0)
  }

  return {
    summary: {
      total: users.length,
      created: totalCreated,
      updated: totalUpdated,
      failed: totalFailed,
    },
    results: mergedResults,
  } as IImportUsersAdminResponse
}
