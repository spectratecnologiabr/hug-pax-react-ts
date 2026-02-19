import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

type CreateTeachingModalityDTO = {
  name: string
  slug: string
}

export async function createTeachingModalityAdmin(data: CreateTeachingModalityDTO) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-modalities`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}