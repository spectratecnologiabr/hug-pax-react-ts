import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function checkSession() {
    const token = getCookies("authToken");
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/session`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error checking session:", error);
        throw new Error("Session check failed");
    }
}