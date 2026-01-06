import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

async function updateUser(userId: number, data: any) {
    const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/user/update/${userId}`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}

export default updateUser