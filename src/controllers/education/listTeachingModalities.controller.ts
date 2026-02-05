import axios from "axios"

export async function listTeachingModalities() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/education/teaching-modalities`
  )

  return response.data
}