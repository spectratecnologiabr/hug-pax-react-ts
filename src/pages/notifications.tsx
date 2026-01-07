import React, { useState, useEffect } from "react";
import listNotifications from "../controllers/notifications/listNotifications.controller";

import AsideMenu from "../components/asideMenu";

import "../style/notifications.css";

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

function Notifications() {
    const [ notifications, setNotifications ] = useState<INotification[]>([])

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const response = await listNotifications();
                setNotifications(response);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        }

        fetchNotifications();
    }, [])

    return (
        <React.Fragment>
            <div className="notifications-container">
                <AsideMenu />
                <div className="notifications-wrapper">
                    <div className="page-title-wrapper">
                        <b>Notificações</b>
                    </div>

                    <div className="notifications-listing">
                        {   // TODO: levar a checagem de status da notificação pro backend
                            notifications.map(notification => 
                                notification.status === 0 ?(<div className="notification-element">
                                    <div className="left">
                                        {notification.title ? (<b className="title">{notification.title}</b>) : "" }
                                        <span className="message">{notification.text}</span>
                                    </div>
                                    <div className="right">
                                        {notification.link ? (<a href={notification.link}>Acesse aqui</a>) : "" }
                                        <span>07/01/2026</span>
                                    </div>
                                </div>
                            ) : "")
                        }
                        
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Notifications;