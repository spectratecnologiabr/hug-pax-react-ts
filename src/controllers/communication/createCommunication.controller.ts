import axios from "axios"
import { getCookies } from "../misc/cookies.controller"

export async function createCommunication(payload: {
  title: string
  message: string
  link?: string
  targets: { type: "ALL_STUDENTS" | "SCHOOL"; referenceId?: number }[]
}) {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/communications`,
    payload,
    { headers: { Authorization: `Bearer ${getCookies("authToken")}` } }
  )
  return res.data
}