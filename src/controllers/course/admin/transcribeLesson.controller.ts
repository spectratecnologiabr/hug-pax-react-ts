import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function transcribeLesson(lessonId: number) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/lessons/${lessonId}/transcribe`,
    {},
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    }
  );

  return response.data;
}
