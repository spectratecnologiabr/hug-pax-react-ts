import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function updateCommunication(
  id: number,
  payload: {
    title?: string
    message?: string
    link?: string
    channels?: Array<"in_app" | "email">
    templateId?: number | null
    templateSlug?: string | null
    templateLanguage?: string | null
    templateVariables?: Record<string, unknown> | null
  }
) {
  await axios.put(
    `${process.env.REACT_APP_API_URL}/communications/${id}`,
    payload,
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )
}
