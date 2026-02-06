import axios from 'axios'
import { getCookies } from '../misc/cookies.controller'

export async function listCommunications(params?: {
  status?: string
  search?: string
  page?: number
}) {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/communications`,
    {
      params,
      headers: { Authorization: `Bearer ${getCookies('authToken')}` }
    }
  )
  return response.data
}