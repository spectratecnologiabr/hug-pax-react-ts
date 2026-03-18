import axios from "axios";
import { getCookies } from "../../misc/cookies.controller";

export async function updateModule(
  moduleId: number,
  data: { title?: string; description?: string; order?: number }
) {
  const response = await axios.put(
    `${process.env.REACT_APP_API_URL}/modules/${moduleId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`,
      },
    }
  );

  return response.data;
}
