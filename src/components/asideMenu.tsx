import React from "react";

import mainIcon from "../img/pax-icon-vertical.svg";
import mainIconWhite from "../img/pax-icon-white.svg";
import homeIcon from "../img/menu/home.svg";
import hatIcon from "../img/menu/hat.svg";
import personIcon from "../img/menu/person.svg";
import mailIcon from "../img/menu/mail.svg";
import gearIcon from "../img/menu/gear.svg";
import logoutIcon from "../img/menu/logout.svg";

import "../style/asideMenu.css";

function AsideMenu() {
    return (
        <div className="aside-container">
            <div className="menu-wrapper">
                <img src={mainIcon} alt="main-logo" className="main-logo" />
                <img src={mainIconWhite} alt="main-logo" className="main-logo-mob" />

                <a href="/dashboard" className="menu-item">
                    <img src={homeIcon} alt="" className="menu-icon" />
                </a>
                <a href="/courses" className="menu-item">
                    <img src={hatIcon} alt="" className="menu-icon" />
                </a>
                <a href="#" className="menu-item">
                    <img src={personIcon} alt="" className="menu-icon" />
                </a>
                <a href="#" className="menu-item">
                    <img src={mailIcon} alt="" className="menu-icon" />
                </a>
                <a href="#" className="menu-item">
                    <img src={gearIcon} alt="" className="menu-icon" />
                </a>
            </div>

            <button className="logout-button">
                <img src={logoutIcon} alt="" />
            </button>
        </div>
    )
}

export default AsideMenu;