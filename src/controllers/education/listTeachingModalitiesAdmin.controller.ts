import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function listTeachingModalitiesAdmin() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-modalities`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}