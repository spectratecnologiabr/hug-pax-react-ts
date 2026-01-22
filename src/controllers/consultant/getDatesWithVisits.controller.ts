import axios from "axios";
import { checkSession } from "../user/checkSession.controller";
import { getCookies } from "../misc/cookies.controller";

export async function getDatesWithVisit(month: string, year: string) {
    const sessionData = await checkSession();

    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/visits/dates-this-month?month=${month}&year=${year}`,
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