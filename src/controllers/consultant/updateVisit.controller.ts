import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function updateVisit(visitId: number, data: any) {
    const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/visits/${visitId}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data;
}