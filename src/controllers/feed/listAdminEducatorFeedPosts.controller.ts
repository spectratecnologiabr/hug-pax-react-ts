import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listAdminEducatorFeedPosts() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/educator-feed`,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` }
    }
  );

  return response.data;
}
