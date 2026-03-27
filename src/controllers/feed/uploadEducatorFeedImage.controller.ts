import axios from "axios";
import { getCookies } from "../misc/cookies.controller";
import { uploadLessonFileController } from "../course/admin/uploadFile.controller";

export async function uploadEducatorFeedImage(file: File) {
  const fileMeta = await uploadLessonFileController(file);

  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/files/feed-image`,
    {
      title: file.name,
      fileKey: fileMeta?.id || fileMeta?.fileKey,
      mimeType: file.type,
      size: file.size,
    },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  const created = response.data?.data ?? response.data;
  const key = created?.fileKey ?? fileMeta?.id ?? fileMeta?.fileKey;

  if (!key) {
    throw new Error("Não foi possível obter a chave da imagem enviada.");
  }

  return {
    fileKey: key,
    url: `${process.env.REACT_APP_API_URL}/files/stream/${encodeURIComponent(key)}`
  };
}
