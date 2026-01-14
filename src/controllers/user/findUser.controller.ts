import axios from "axios";

export async function findUser(userId: string) {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error finding user:", error);
        throw error;
    }
}