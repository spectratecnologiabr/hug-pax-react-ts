

import axios from "axios";

export async function uploadLessonFileController(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const uploadResponse = await axios.post(
    `${process.env.REACT_APP_CDN_URL}/api/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_CDN_TOKEN}`,
      },
    }
  );

  return uploadResponse.data.file;
}