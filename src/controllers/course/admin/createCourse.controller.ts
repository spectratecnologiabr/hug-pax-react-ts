import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export interface ICourseData {
	slug: string,
	title: string,
	subTitle?: string,
	cover: string,
	workload: number,
    series: string[]
}

export async function createCourse(data: ICourseData) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/courses`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data;
}