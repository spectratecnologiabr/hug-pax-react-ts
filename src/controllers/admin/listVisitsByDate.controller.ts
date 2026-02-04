import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listVisitsByDate(date: string, consultantId?: number) {
        const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/by-date?date=${date}&consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/by-date?date=${date}`
    
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${getCookies("authToken")}` } })

    return response.data
}   