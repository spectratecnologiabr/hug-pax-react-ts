import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getPlayback(courseId: number) {
  try {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/playback/${courseId}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )
    return response.data
  } catch (error: any) {
    console.error("getPlayback error:", error?.response || error)
    return null
  }
}