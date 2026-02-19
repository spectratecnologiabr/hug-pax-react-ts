import axios from "axios";

export async function getCurrentLegalDocumentsPublic() {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/legal-documents/public/current`);
  return response.data;
}
