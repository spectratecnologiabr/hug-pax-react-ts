import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function deleteEducatorFeedPost(id: number) {
  await axios.delete(
    `${process.env.REACT_APP_API_URL}/educator-feed/${id}`,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` }
    }
  );
}
