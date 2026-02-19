import axios from "axios";

export async function getLession(lessionId: number) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/lessons/${lessionId}`
    );

    return response.data    
}