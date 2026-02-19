import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function listDatesWithVisits(
  year: string,
  month: string,
  consultantId?: number
) {
  try {
    const params = new URLSearchParams({
      month,
      year,
    });

    if (consultantId) {
      params.append("consultantId", String(consultantId));
    }

    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/visits/admin/dates-this-month?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getCookies("authToken")}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error listing visits:", error);
    return [];
  }
}