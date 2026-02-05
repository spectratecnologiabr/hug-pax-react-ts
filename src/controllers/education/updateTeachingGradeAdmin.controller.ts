import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

type UpdateTeachingGradeDTO = {
  name: string
  order: number
}

export async function updateTeachingGradeAdmin(id: number, data: UpdateTeachingGradeDTO) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-grades/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}