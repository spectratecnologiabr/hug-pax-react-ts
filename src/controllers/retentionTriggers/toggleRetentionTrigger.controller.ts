import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function toggleRetentionTrigger(id: number, isActive?: boolean) {
  const response = await axios.patch(
    `${process.env.REACT_APP_API_URL}/retention-triggers/${id}/toggle`,
    { isActive },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  )
  return response.data
}
