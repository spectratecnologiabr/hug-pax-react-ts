import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listVistsThisWeek(consultantId?: number) {
    const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/this-week?consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/this-week`
    
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${getCookies("authToken")}` } })

    return response.data
}