import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function publishLegalDocumentAdmin(id: number) {
  await axios.patch(`${process.env.REACT_APP_API_URL}/legal-documents/admin/${id}/publish`, {}, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` }
  });
}
