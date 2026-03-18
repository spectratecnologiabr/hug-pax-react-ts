import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function deleteCollege(collegeId: number) {
  const response = await axios.delete(`${process.env.REACT_APP_API_URL}/colleges/${collegeId}`, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });

  return response.data;
}
