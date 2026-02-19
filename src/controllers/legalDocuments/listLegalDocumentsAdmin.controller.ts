import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listLegalDocumentsAdmin() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/legal-documents/admin`, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` }
  });
  return response.data;
}
