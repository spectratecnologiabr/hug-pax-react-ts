import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listVistsThisMonth(consultantId?: number) {
    const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/this-month?consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/this-month`
    
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${getCookies("authToken")}` } })

    return response.data
}