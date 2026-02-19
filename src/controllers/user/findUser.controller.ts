import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function findUser(userId: string | number) {
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/user/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${getCookies("authToken")}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error finding user:", error);
        throw error;
    }
}
