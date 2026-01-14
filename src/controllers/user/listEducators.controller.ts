import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listEducators() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/educators`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`,
            }
        }
    )

    return response.data.data;
}