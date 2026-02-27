import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export interface ICreateContractPayload {
  name: string;
  address?: string | null;
  zipCode?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  coordinatorId?: number;
  consultantIds: number[];
  studentsCount: number;
  teachersCount: number;
  booksCount: number;
}

export async function createContract(data: ICreateContractPayload) {
  const response = await axios.post(
    `${process.env.REACT_APP_API_URL}/contracts`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
