import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TCreateNotificationTemplatePayload = {
  slug?: string;
  name: string;
  channel: string;
  language: string;
  category?: string;
  subject?: string;
  body: string;
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function createNotificationTemplate(payload: TCreateNotificationTemplatePayload) {
  const normalizedName = payload.name?.trim();
  const normalizedChannel = String(payload.channel || "").trim().toLowerCase();
  const normalizedSlug = normalizeSlug(payload.slug?.trim() || normalizedName);
  if (!normalizedName) {
    throw new Error("Nome inválido para criação de template.");
  }
  if (!["email", "whatsapp", "in_app"].includes(normalizedChannel)) {
    throw new Error("Canal inválido para criação de template.");
  }
  if (!normalizedSlug) {
    throw new Error("Slug inválida para criação de template.");
  }

  const response = await axios.post(`${process.env.REACT_APP_API_URL}/notification-templates`, {
    ...payload,
    channel: normalizedChannel,
    name: normalizedName,
    slug: normalizedSlug,
  }, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` },
  });

  return response.data?.data ?? response.data;
}
