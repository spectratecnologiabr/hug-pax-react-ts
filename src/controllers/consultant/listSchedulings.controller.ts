import axios from "axios";
import { checkSession } from "../user/checkSession.controller";
import { getCookies } from "../misc/cookies.controller";

export async function listSchedulings(date: string) {
    const sessionData = await checkSession();

    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/visits/by-consultant?consultantId=${sessionData.session.sub}&date=${date}`,
            {
                headers: {
                    Authorization: `Bearer ${getCookies("authToken")}`,
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error listing schedulings:", error);
    }

}