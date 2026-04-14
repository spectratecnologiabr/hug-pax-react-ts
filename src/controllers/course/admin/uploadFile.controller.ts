

import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export type UploadedLessonFileAsset = {
  id?: string;
  fileKey?: string;
  key?: string;
  path?: string;
  url?: string;
  mimeType?: string | null;
  size?: number | null;
  originalName?: string | null;
};

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

  return (uploadResponse.data?.file ?? uploadResponse.data?.data ?? uploadResponse.data) as UploadedLessonFileAsset;
}
