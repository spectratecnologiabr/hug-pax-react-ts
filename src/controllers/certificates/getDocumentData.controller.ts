import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getDocumentData(code: string) {
        const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/certificates/document/${code}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );
    return response.data?.data ?? response.data;
}
