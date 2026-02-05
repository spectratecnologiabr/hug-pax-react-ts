import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function listTeachingGradesAdmin(modalityId: number) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-grades`,
    {
      params: { modalityId },
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}