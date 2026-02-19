import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export interface IModuleData {
    courseId: number,
	title: string,
	description: string,
	order: number
}

export async function createModule(data: IModuleData) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/modules`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data
}