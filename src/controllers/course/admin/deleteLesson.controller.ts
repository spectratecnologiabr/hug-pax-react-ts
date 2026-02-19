import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function deleteLesson(lessonId: number) {
  const response = await axios.delete(
    `${process.env.REACT_APP_API_URL}/lessons/${lessonId}`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
