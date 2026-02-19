import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listLast30Visits(consultantId?: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/visits/admin/last-30`,
        {
            params: consultantId ? { consultantId } : undefined,
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data;
}