import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TCreateNotificationTemplateVersionPayload = {
  baseVersionId?: number;
  name?: string;
  subject?: string;
  body?: string;
  category?: string;
};

export async function createNotificationTemplateVersion(
  templateId: number | string,
  payload: TCreateNotificationTemplateVersionPayload
) {
  const response = await axios.put(`${process.env.REACT_APP_API_URL}/notification-templates/${templateId}`, payload, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  });

  return response.data?.data ?? response.data;
}
