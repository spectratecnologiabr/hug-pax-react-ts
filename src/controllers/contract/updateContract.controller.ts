import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export interface IUpdateContractPayload {
  id: number;
  name: string;
  coordinatorId?: number;
  consultantIds: number[];
}

export async function updateContract(data: IUpdateContractPayload) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/contracts/${data.id}`,
    {
      name: data.name,
      coordinatorId: data.coordinatorId,
      consultantIds: data.consultantIds,
    },
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
