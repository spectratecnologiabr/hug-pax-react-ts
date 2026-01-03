import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function rateLesson(lessonId: number, stars: number) {
    await axios.post(
        `${process.env.REACT_APP_API_URL}/rates`,
        {
            lessonId,
            stars
        },
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )
}