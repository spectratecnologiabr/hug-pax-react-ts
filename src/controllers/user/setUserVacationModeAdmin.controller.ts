import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function setUserVacationModeAdmin(userId: number, enabled: boolean, message?: string) {
  const response = await axios.patch(
    `${process.env.REACT_APP_API_URL}/user/admin/users/${userId}/vacation-mode`,
    { enabled, message },
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )

  return response.data?.data ?? response.data
}
