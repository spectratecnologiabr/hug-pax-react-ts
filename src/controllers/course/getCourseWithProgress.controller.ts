import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getCourseWithProgress(courseSlug: string) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/courses/${courseSlug}/with-progress`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data
}