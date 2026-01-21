import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function visitsThisWeek() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/visits/this-week`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}