import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function updateLegalDocumentAdmin(id: number, payload: { title?: string; content?: string }) {
  await axios.put(`${process.env.REACT_APP_API_URL}/legal-documents/admin/${id}`, payload, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` }
  });
}
