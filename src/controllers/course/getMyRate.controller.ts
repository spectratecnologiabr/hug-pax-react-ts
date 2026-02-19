import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getMyRate(lessonId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/rates/lesson/${lessonId}/me`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data
}