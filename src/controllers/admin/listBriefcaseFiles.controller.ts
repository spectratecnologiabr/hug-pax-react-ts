import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TAdminBriefcaseFile = {
  id: number | string;
  name?: string;
  fileName?: string;
  originalName?: string;
  title?: string;
  url?: string;
  fileUrl?: string;
  downloadUrl?: string;
  path?: string;
  type?: string;
  fileType?: string;
  extension?: string;
  createdAt?: string;
};

export async function listBriefcaseFiles() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/files/briefcase`, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });

  return (response.data?.data ?? response.data) as Array<TAdminBriefcaseFile>;
}

