import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function updateCommunication(
  id: number,
  payload: { title?: string; message?: string; link?: string }
) {
  await axios.put(
    `${process.env.REACT_APP_API_URL}/communications/${id}`,
    payload,
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )
}