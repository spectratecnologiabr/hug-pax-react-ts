import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function deleteFile(fileId: number) {
  const response = await axios.delete(
    `${process.env.REACT_APP_API_URL}/files/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
