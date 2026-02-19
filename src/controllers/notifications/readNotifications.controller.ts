import axios from "axios";
import { getCookies } from "../misc/cookies.controller";

type INotification = {
    id: number,
    userId: number,
    status: number,
    title?: string,
    text: string,
    link?: string,
    createdAt: string,
    updatedAt: string
}

async function readNotifications(data: Array<INotification>) {
    data.forEach(async notification => {
        await axios.put(
            `${process.env.REACT_APP_API_URL}/notifications/${notification.id}/read`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${getCookies("authToken")}`
                }
            }
        )
    })
}

export default readNotifications;