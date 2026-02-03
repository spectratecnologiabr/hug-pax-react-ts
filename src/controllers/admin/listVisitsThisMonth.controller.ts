import axios from "axios";

export async function listVistsThisMonth(consultantId?: number) {
    const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/this-month?consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/this-month`
    
    const response = await axios.get(url)

    return response.data
}