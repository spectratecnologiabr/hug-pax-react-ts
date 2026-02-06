import axios from 'axios'
import { getCookies } from '../misc/cookies.controller'

export async function getCommunicationsSummary() {
  const response = await axios.get(
    `${process.env.REACT_APP_API_URL}/communications/summary`,
    {
      headers: { Authorization: `Bearer ${getCookies('authToken')}` }
    }
  )
  return response.data
}