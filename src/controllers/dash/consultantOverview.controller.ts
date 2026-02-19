import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function getConsultanOverviewData() {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/dashboard/consultant/overview`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`,
            },
        }
    );
    return response.data;
}