import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getNotificationTemplateById(templateId: number | string) {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/notification-templates/${templateId}`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  });

  return response.data?.data ?? response.data;
}
