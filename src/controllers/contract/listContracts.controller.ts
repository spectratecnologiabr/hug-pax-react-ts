import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TContractConsultant = {
  id: number;
  firstName: string;
  lastName: string;
  management?: string | null;
};

export type TContractSchool = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  gee?: string | null;
};

export type TContractItem = {
  id: number;
  name: string;
  address?: string | null;
  zipCode?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  coordinatorId: number;
  studentsCount: number;
  teachersCount: number;
  booksCount: number;
  coordinatorName: string;
  coordinatorManagement?: string | null;
  consultants: TContractConsultant[];
  schools?: TContractSchool[];
  consultantIds: number[];
  createdAt?: string;
  updatedAt?: string;
};

export async function listContracts(): Promise<TContractItem[]> {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/contracts`, {
    headers: {
      Authorization: `Bearer ${getCookies("authToken")}`,
    },
  });
  return response.data?.data ?? [];
}
