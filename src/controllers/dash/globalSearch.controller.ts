import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function globalSearch(queryString: string) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/search?q=${queryString}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}