import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function acceptLegalDocuments() {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/legal-documents/accept`, {}, {
    headers: { Authorization: `Bearer ${getCookies("authToken")}` }
  });
  return response.data;
}
