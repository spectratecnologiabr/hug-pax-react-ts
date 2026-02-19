import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function createCommunication(payload: {
  title?: string
  message?: string
  link?: string
  channels?: Array<"in_app" | "email">
  templateId?: number | null
  templateSlug?: string | null
  templateLanguage?: string | null
  templateVariables?: Record<string, unknown> | null
  targets: { type: "ALL_STUDENTS" | "SCHOOL" | "COURSE"; referenceId?: number }[]
}) {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/communications`,
    payload,
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )
  return res.data
}
