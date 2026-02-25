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

const IMPORT_CHUNK_SIZE = 500

function chunkColleges(colleges: Record<string, unknown>[], chunkSize: number): Record<string, unknown>[][] {
  const chunks: Record<string, unknown>[][] = []
  for (let index = 0; index < colleges.length; index += chunkSize) {
    chunks.push(colleges.slice(index, index + chunkSize))
  }
  return chunks
}

export async function importCollegesAdmin(payload: IImportCollegesAdminPayload) {
  const colleges = Array.isArray(payload?.colleges) ? payload.colleges : []
  if (!colleges.length) {
    return {
      summary: { total: 0, created: 0, failed: 0 },
      results: [],
    }
  }

  const chunks = chunkColleges(colleges, IMPORT_CHUNK_SIZE)
  const mergedResults: IImportCollegesAdminResultItem[] = []
  let totalCreated = 0
  let totalFailed = 0

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const batch = chunks[chunkIndex]
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/colleges/admin/import`,
      { colleges: batch },
      { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
    )

    const chunkResult = (response.data?.data ?? response.data) as IImportCollegesAdminResponse
    const rowOffset = chunkIndex * IMPORT_CHUNK_SIZE

    const normalizedResults = Array.isArray(chunkResult?.results)
      ? chunkResult.results.map((item) => ({
          ...item,
          row: Number(item?.row) + rowOffset,
        }))
      : []

    mergedResults.push(...normalizedResults)
    totalCreated += Number(chunkResult?.summary?.created ?? 0)
    totalFailed += Number(chunkResult?.summary?.failed ?? 0)
  }

  return {
    summary: {
      total: colleges.length,
      created: totalCreated,
      failed: totalFailed,
    },
    results: mergedResults,
  } as IImportCollegesAdminResponse
}
