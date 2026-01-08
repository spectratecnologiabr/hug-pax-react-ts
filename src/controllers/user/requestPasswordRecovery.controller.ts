import axios from "axios";

async function requestPasswordRecovery(email: string) {
    const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/request-password-recovery`,
        {
            email
        }
    )

    return response.data
}

export default requestPasswordRecovery