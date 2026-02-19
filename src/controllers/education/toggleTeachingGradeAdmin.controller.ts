import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function toggleTeachingGradeAdmin(id: number) {
  const response = await axios.patch(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-grades/${id}/toggle`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}