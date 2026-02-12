import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TListNotificationTemplatesQuery = {
  q?: string;
  status?: string;
  channel?: string;
  category?: string;
  language?: string;
  page?: number;
  limit?: number;
};

export async function listNotificationTemplates(query: TListNotificationTemplatesQuery = {}) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/notification-templates`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    params: query,
  });

  return response.data?.data ?? response.data;
}
