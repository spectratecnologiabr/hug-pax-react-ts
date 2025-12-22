import axios from "axios";

export async function getCourseModules(courseId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/modules/course/${courseId}`
    );

    return response.data
}