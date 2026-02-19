import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getCourseModules(courseId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/modules/course/${courseId}/with-progress`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data
}