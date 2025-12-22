import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listProgress() {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/progress/me`, {
        headers: {
            Authorization: `Bearer ${getCookies("authToken")}`
        }
    });
    return response.data;
}