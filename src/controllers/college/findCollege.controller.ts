import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function findCollege(collegeId: string) {
    const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/colleges/${collegeId}`,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );
    return response.data;
}