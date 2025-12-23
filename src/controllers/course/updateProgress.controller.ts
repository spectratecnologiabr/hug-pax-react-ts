import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function updateProgress(lessonId: number, percentage: number) {
    await axios.put(
        `${process.env.REACT_APP_API_URL}/progress`,
        {
            lessonId,
            percentage
        },
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )
}