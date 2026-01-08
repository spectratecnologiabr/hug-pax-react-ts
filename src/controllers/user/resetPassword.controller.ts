import axios from "axios";

async function resetPassword(token: string, password: string) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/reset-password`,
        {
            token,
            password
        }
    )

    return response.data
}

export default resetPassword