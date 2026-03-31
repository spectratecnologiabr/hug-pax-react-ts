import axios from "axios";
import { getCookies } from "../misc/cookies.controller";
import { CourseCategory } from "../../utils/courseCategory";

type ListCoursesQuery = {
    page?: number
    pageSize?: number
    search?: string
    status?: string
    order?: string
    category?: CourseCategory
}

export async function listCourses(query?: ListCoursesQuery) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/courses/with-progress`,
        {
            params: query,
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );
    return response.data;
}
