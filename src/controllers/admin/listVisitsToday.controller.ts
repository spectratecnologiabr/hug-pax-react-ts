import axios from "axios";

export async function listVistsToday(consultantId?: number) {
    const url = consultantId 
        ? `${process.env.REACT_APP_API_URL}/visits/admin/today?consultantId=${consultantId}`
        : `${process.env.REACT_APP_API_URL}/visits/admin/today`
    
    const response = await axios.get(url)

    return response.data
}
