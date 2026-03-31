import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";
import { CourseCategory } from "../../../utils/courseCategory";

export interface IUpdateCourseData {
    title?: string
    category?: CourseCategory
    subTitle?: string
    cover?: string
    workload?: number
    series?: string[]
}

export async function updateCourse(courseId: number, data: IUpdateCourseData) {
    const response = await axios.put(`${process.env.REACT_APP_API_URL}/courses/${courseId}`, data,
        {
            headers: {
                Authorization: `Bearer ${getCookies('authToken')}`
            }
        }
    );

    return response.data;
}
