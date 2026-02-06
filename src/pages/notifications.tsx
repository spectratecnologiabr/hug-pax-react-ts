import React, { useState, useEffect } from "react";
import listNotifications from "../controllers/notifications/listNotifications.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";
import readNotifications from "../controllers/notifications/readNotifications.controller";

import DOMPurify from "dompurify";

import AsideMenu from "../components/asideMenu";
import Footer from "../components/footer";

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

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function Notifications() {
    const [ notifications, setNotifications ] = useState<INotification[]>([])
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const response = await listNotifications();
                setNotifications(response);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        }

        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        fetchNotifications();
        fetchOverviewData();
    }, [])

    const formatDate = (date: string) => {
        const d = new Date(date);

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();

        const hora = String(d.getHours() + 3).padStart(2, '0');
        const minuto = String(d.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    };

    useEffect(() => {
        if (!notifications.length) return;

        async function updateNotifications() {
            try {
                await readNotifications(notifications);
            } catch (error) {
                console.error("Error updating notifications:", error);
            }
        }

        updateNotifications();
    }, [notifications]);

    return (
        <React.Fragment>
            <div className="notifications-container">
                <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="notifications-wrapper">
                    <div className="page-title-wrapper">
                        <b>Notificações</b>
                    </div>

                    <div className="notifications-listing">
                        {   
                            notifications.length ?
                                notifications.map(notification => 
                                    <div className="notification-element">
                                        <div className="left">
                                            {notification.title ? (<b className="title">{notification.title}</b>) : "" }
                                            <span
                                              className="message"
                                              dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(notification.text)
                                              }}
                                            />
                                        </div>
                                        <div className="right">
                                            {
                                                //notification.link ? (<a href={notification.link}>Acesse aqui</a>) : "" 
                                            }
                                            <span>{formatDate(notification.createdAt)}</span>
                                        </div>
                                    </div>
                                )
                            : <div className="no-content-container">
                                <span>Nenhuma nova notificação no momento</span>
                            </div>
                        }
                        
                    </div>
                </div>
            </div>
            <Footer />
        </React.Fragment>
    )
}

export default Notifications;