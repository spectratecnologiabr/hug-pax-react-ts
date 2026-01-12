import axios from "axios";

export interface ICollegeProps {
    "name": string,
    "partner": string,
    "address": string,
    "addressNumber": number,
    "state": string,
    "city": string,
    "management": string,
    "collegeSeries": any[],
    "contractSeries": any[],
    "salesManager": string,
    "coordinator": string,
    "internalManagement": any[]
}

export async function createCollege(data: ICollegeProps) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/colleges`,
        data,
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}