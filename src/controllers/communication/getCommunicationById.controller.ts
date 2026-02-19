import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function getCommunicationById(id: number) {
  const res = await axios.get(
    `${process.env.REACT_APP_API_URL}/communications/${id}`,
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )
  return res.data
}