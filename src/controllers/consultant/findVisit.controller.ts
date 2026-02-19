import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function findVisit(visitId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/visits/${visitId}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}