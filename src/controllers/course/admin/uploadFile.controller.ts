

import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function uploadLessonFileController(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await axios.post(
    `${process.env.REACT_APP_API_URL}/files/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return uploadResponse.data.file;
}
