import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function updateRetentionTrigger(
  id: number,
  payload: {
    name?: string
    inactivityDays?: number
    targetRole?: "educator" | "consultant"
    title?: string
    message?: string
    link?: string | null
    channels?: Array<"in_app" | "email">
    isActive?: boolean
  }
) {
  await axios.put(
    `${process.env.REACT_APP_API_URL}/retention-triggers/${id}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  )
}
