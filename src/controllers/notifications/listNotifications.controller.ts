import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

async function listNotifications() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/notifications`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}

export default listNotifications