import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function visitsThisMonth() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/visits/this-month`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}