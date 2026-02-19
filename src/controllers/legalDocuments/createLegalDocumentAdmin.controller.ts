import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function createLegalDocumentAdmin(payload: {
  documentType: "terms" | "privacy";
  title: string;
  content: string;
  publish?: boolean;
}) {
  await axios.post(`${process.env.REACT_APP_API_URL}/legal-documents/admin`, payload, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` }
  });
}
