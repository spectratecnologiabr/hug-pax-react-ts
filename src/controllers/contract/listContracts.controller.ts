import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export type TContractConsultant = {
  id: number;
  firstName: string;
  lastName: string;
  management?: string | null;
};

export type TContractItem = {
  id: number;
  name: string;
  coordinatorId: number;
  coordinatorName: string;
  coordinatorManagement?: string | null;
  consultants: TContractConsultant[];
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
