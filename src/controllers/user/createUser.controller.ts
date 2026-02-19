import axios from "axios";

export interface ICreateUserData {
    firstName: string
    lastName: string
    email: string
    password: string
    role?: 'educator' | 'consultant' | 'coordinator' | 'admin',
    docType?: string,
    docId?: string,
    birthDate?: string,
    gender?: string,
    profilePic?: string,
    phone?: string,
    language?: string,
    collegeId?: number | null
}

export async function createUser(userData: ICreateUserData) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        userData
    );
    return response.data;
}