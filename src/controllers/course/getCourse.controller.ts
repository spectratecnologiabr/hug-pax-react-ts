import axios from "axios";

export async function getCourseById(courseId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/courses/id/${courseId}`,
    );

    return response.data
}