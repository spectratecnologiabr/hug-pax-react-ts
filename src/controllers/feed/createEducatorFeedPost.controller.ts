import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function createEducatorFeedPost(data: {
  title: string;
  body: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  displayOrder: number;
  isActive: boolean;
}) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/educator-feed`,
    data,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` }
    }
  );

  return response.data;
}
