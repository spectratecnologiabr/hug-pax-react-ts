import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listEducatorFeedPosts() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/educator-feed/public`,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` }
    }
  );

  return response.data;
}
