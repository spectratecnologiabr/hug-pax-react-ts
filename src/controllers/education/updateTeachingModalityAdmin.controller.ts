import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

type UpdateTeachingModalityDTO = {
  name: string
  slug: string
}

export async function updateTeachingModalityAdmin(
  id: number,
  data: UpdateTeachingModalityDTO
) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-modalities/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}