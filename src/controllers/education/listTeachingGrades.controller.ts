import axios from "axios"

export async function listTeachingGrades(modalityId?: number) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/education/teaching-grades`,
    {
      params: modalityId ? { modalityId } : undefined,
    }
  )

  return response.data
}