import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TPreviewNotificationTemplatePayload = {
  variables?: Record<string, any>;
  subject?: string;
  body?: string;
};

export async function previewNotificationTemplate(
  templateId: number | string,
  payload: TPreviewNotificationTemplatePayload
) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/notification-templates/${templateId}/preview`,
    payload,
    {
      headers: { Authorization: `Bearer ${getCookies("authToken")}` },
    }
  );

  return response.data?.data ?? response.data;
}
