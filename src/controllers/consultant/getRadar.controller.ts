import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getRadar() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/visits/radar`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`,
            }
        }
    );

    return response.data;
}