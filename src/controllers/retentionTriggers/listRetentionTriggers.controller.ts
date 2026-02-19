import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function listRetentionTriggers() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/retention-triggers`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  )
  return response.data
}
