import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TBriefcaseFile = {
  id: number | string;
  name?: string;
  title?: string;
  fileKey?: string;
  path?: string;
  url?: string;
  fileUrl?: string;
  downloadUrl?: string;
  type?: string;
  mimeType?: string;
  mimetype?: string;
  contentType?: string;
  extension?: string;
};

export async function getBriefcaseFiles() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/briefcase`, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });

  return (response.data?.data ?? response.data) as Array<TBriefcaseFile>;
}
