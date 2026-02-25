import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

type ListCollegesQuery = {
    search?: string;
    page?: number;
    pageSize?: number;
}

export async function listColleges(query?: ListCollegesQuery) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/colleges`,
        {
            params: query,
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );
    const payload = response.data?.data ?? response.data;
    const expectsPaginated = Boolean(query && (query.search || query.page || query.pageSize));

    if (expectsPaginated) {
        return payload;
    }

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}
