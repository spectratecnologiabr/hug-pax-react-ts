import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function runRetentionTriggers(triggerId?: number) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/retention-triggers/run`,
    triggerId ? { triggerId } : {},
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  )
  return response.data
}
