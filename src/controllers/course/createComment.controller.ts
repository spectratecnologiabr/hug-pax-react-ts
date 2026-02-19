import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function createComment(lessonId: number, text: string) {
    await axios.post(
        `${process.env.REACT_APP_API_URL}/comments`,
        {
            lessonId,
            text
        },
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )
}