import axios from "axios";

export async function listVistsThisWeek(consultantId?: number) {
    const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/this-week?consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/this-week`
    
    const response = await axios.get(url)

    return response.data
}