import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

export async function sendCommunicationNow(communicationId: number) {
  await axios.post(
    `${process.env.REACT_APP_API_URL}/communications/${communicationId}/send`,
    {},
    {
      headers: {
        Authorization: `Bearer ${getCookies("authToken")}`
      }
    }
  );
}