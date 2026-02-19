import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function checkSession() {
    const token = getCookies("authToken");
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/session`, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}
