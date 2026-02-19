import axios from "axios";
import { getCookies } from "../misc/cookies.controller";
import { uploadLessonFileController } from "../course/admin/uploadFile.controller";

type TCreateBriefcaseFileData = {
  file: File;
  name?: string;
};

export async function createBriefcaseFile(data: TCreateBriefcaseFileData) {
  const fileTitle = data.name?.trim() || data.file.name;
  const fileMeta = await uploadLessonFileController(data.file);

  const payload = {
    title: fileTitle,
    fileKey: fileMeta?.id,
    mimeType: data.file.type,
    size: data.file.size,
  };

  const response = await axios.post(`${process.env.REACT_APP_API_URL}/files/briefcase`, payload, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });

  return response.data?.data ?? response.data;
}
