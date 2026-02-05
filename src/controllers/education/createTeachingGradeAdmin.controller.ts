import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

type CreateTeachingGradeDTO = {
  modalityId: number
  name: string
  order: number
}

export async function createTeachingGradeAdmin(data: CreateTeachingGradeDTO) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/education/admin/teaching-grades`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  )

  return response.data
}