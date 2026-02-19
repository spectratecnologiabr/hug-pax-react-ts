import axios from 'axios';
import { getCookies } from '../misc/cookies.controller';

export interface ICollegeUpdateProps {
    id?: string,
    contract?: string,
    initDate?: string,
    name?: string,
    partner?: string,
    address?: string,
    addressNumber?: number,
    state?: string,
    city?: string,
    management?: string,
    salesManager?: string,
    consultor?: string,
    collegeSeries?: string,
    contractSeries?: string,
    internalManagement?: any[],
    isActive?: boolean
}

export async function updateCollege(data: ICollegeUpdateProps) {
    const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/colleges/${data.id}`,
        {
            ...data,
            id: undefined
        },
        {
            headers: {
                Authorization: `Bearer ${getCookies("authToken")}`
            }
        }
    );
    
    return response.data;
}