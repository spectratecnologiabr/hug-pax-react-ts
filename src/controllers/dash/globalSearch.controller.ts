import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function globalSearch(queryString: string, filters?: { category?: string; tag?: string }) {
    const params = new URLSearchParams();
    params.set("q", queryString);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.tag) params.set("tag", filters.tag);

    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/search?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    )

    return response.data
}
