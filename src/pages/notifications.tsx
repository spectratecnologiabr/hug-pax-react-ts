import React from "react";

import AsideMenu from "../components/asideMenu";

import "../style/notifications.css";

function Notifications() {
    return (
        <React.Fragment>
            <div className="notifications-container">
                <AsideMenu />
                <div className="notifications-wrapper">
                    <div className="page-title-wrapper">
                        <b>Notificações</b>
                    </div>

                    <div className="notifications-listing">
                        <div className="notification-element">
                            <div className="left">
                                <span className="message">Sua matrícula no curso 1º Ano do Ensino Médio foi realizada com sucesso</span>
                            </div>
                            <div className="right">
                                <a href="/courses">Acesse aqui</a>
                                <span>07/01/2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Notifications;