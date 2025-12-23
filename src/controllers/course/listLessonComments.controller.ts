import axios from "axios";

export async function listLessonComments(lessonId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/comments/lesson/${lessonId}`
    )

    return response.data
}