import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

interface UpdatePlaybackPayload {
  courseId: number
  lessonId: number
  type: "video" | "pdf"
  position: number
  duration?: number
}

export async function updatePlayback(payload: UpdatePlaybackPayload) {
  try {
    const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/user/playback`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )
    return response.data
  } catch (error: any) {
    console.error("updatePlayback error:", error?.response || error)
    throw error
  }
}