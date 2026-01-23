import React from "react";
import PageSelector from "./pageSelector";

import mainIcon from "../img/pax-icon-vertical.svg";
import mainIconWhite from "../img/pax-icon-white.svg";
import homeIcon from "../img/menu/home.svg";
import hatIcon from "../img/menu/hat.svg";
import personIcon from "../img/menu/person.svg";
import notificationIcon from "../img/notification.svg";
import certIcon from "../img/menu/cert.svg";
import logoutIcon from "../img/menu/logout.svg";

import { doLogout } from "../controllers/user/logout.controller";

import "../style/asideMenu.css";

function AsideMenu(props: {notificationCount: number}) {
    const pathname = window.location.pathname;

    return (
        <div className="aside-container">
            <div className="menu-wrapper">
                <img src={mainIcon} alt="main-logo" className="main-logo" />
                <img src={mainIconWhite} alt="main-logo" className="main-logo-mob" />

                <a href="/dashboard" className={pathname.match("/dashboard") ? "menu-item active" : "menu-item"} title="Dashboard">
                    <img src={homeIcon} alt="" className="menu-icon" />
                </a>
                <a href="/courses" className={pathname.match("/courses") ? "menu-item active" : "menu-item"} title="Cursos">
                    <img src={hatIcon} alt="" className="menu-icon" />
                </a>
                <a href="/profile" className={pathname.match("/profile") ? "menu-item active" : "menu-item"} title="Meu Perfil">
                    <img src={personIcon} alt="" className="menu-icon" />
                </a>
                <a href="/certificates" className={pathname.match("/certificates") ? "menu-item active" : "menu-item"} title="Meus Certificados">
                    <img src={certIcon} alt="" className="menu-icon" />
                </a>
                <a href="/notifications" className={pathname.match("/notifications") ? "menu-item active" : "menu-item"} title="Notificações">
                    <img src={notificationIcon} alt="" className="menu-icon" />
                    {
                        props.notificationCount > 0 && (
                            <span className="notification-count">
                                {props.notificationCount > 9 ? "9+" : props.notificationCount}
                            </span>
                        )
                    }
                </a>
                <PageSelector />
            </div>

            <button className="logout-button" onClick={doLogout}>
                <img src={logoutIcon} alt="" />
            </button>
        </div>
    )
}

export default AsideMenu;