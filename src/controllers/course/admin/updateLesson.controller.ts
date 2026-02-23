

import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function updateLessonExtUrl(lessonId: number, extUrl: string) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/lessons/${lessonId}`,
    { extUrl },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}

export async function updateLessonAllowDownload(lessonId: number, allowDownload: boolean) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/lessons/${lessonId}`,
    { allowDownload },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}

export async function updateLessonCode(lessonId: number, code: string) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/lessons/${lessonId}`,
    { code },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
