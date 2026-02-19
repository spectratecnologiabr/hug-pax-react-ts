import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export interface ICollegeProps {
    collegeCode: number,
    initDate: string,
    name: string,
    partner: string,
    address: string,
    addressNumber: number,
    state: string,
    city: string,
    management: string,
    collegeSeries: string,
    contractSeries: string,
    salesManager: string,
    consultorId: number,
    internalManagement: any[]
    isActive?: boolean
}

export async function createCollege(data: ICollegeProps) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/colleges`,
        data,
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );

    return response.data;
}