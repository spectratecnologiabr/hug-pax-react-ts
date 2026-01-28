

import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export type CreateFilePayload = {
  lessonId: number;
  courseId: number;
  fileKey: string;
  fileType: string;
  mimeType?: string;
  size?: number;
};

export async function createFile(payload: CreateFilePayload) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/files`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}