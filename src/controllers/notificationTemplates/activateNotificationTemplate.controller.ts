import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function activateNotificationTemplate(templateId: number | string) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/notification-templates/${templateId}/activate`,
    {},
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    }
  );

  return response.data?.data ?? response.data;
}
