import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function createScheduling(data: any) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/visits`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}