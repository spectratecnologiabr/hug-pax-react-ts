import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function deleteBriefcaseFile(fileId: number | string) {
  const response = await axios.delete(`${process.env.REACT_APP_API_URL}/files/briefcase/${fileId}`, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });

  return response.data?.data ?? response.data;
}
