import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function createRetentionTrigger(payload: {
  name: string
  inactivityDays: number
  targetRole: "educator" | "consultant"
  title: string
  message: string
  link?: string
  channels: Array<"in_app" | "email">
  isActive?: boolean
}) {
  await axios.post(
    `${process.env.REACT_APP_API_URL}/retention-triggers`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  )
}
