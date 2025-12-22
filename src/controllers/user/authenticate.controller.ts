import axios from "axios";

export async function authenticate(email: string, password: string) {
  const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
    email,
    password,
  });
  
  return response.data;
}