import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function updateCourse(courseId: number, data: any) {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/courses/${courseId}`, data,
        {
            headers: {
                Authorization: `Bearer ${getCookies('authToken')}`
            }
        }
    );

    return response.data;
}
