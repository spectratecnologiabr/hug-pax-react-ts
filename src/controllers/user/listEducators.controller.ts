import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type ListEducatorsQuery = {
    search?: string;
    status?: "active" | "inactive";
    collegeId?: number;
}

export async function listEducators(query?: ListEducatorsQuery) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/educators`,
        {
            params: query,
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`,
            }
        }
    )

    return response.data.data;
}
