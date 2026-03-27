import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function updateEducatorFeedPost(
  id: number,
  data: {
    title: string;
    body: string;
    imageUrl?: string;
    linkUrl?: string;
    linkLabel?: string;
    displayOrder: number;
    isActive: boolean;
  }
) {
  await axios.put(
    `${process.env.REACT_APP_API_URL}/educator-feed/${id}`,
    data,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` }
    }
  );
}
