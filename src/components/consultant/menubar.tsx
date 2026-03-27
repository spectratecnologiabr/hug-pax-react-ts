import React, { useState, useEffect } from "react";
import { getCookies, removeCookies } from "../../controllers/misc/cookies.controller";
import { doLogout } from "../../controllers/user/logout.controller";
import { checkSession } from "../../controllers/user/checkSession.controller";

import PageSelector from "../pageSelector";

import paxIconWhite from "../../img/pax-icon-white.svg";
import homeIcon from "../../img/menu/home.svg";
import personIcon from "../../img/menu/person.svg";

import "../../style/menubar.css";
function Menubar(props: {notificationCount: number}) {
    const userName = (getCookies("userData")).firstName;
    const pathname = window.location.pathname;
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        async function fetchUserRole() {
            try {
                await checkSession();
            } catch (error: any) {
                const code = String(error?.response?.data?.code ?? "");
                if (code === "VACATION_MODE") {
                    removeCookies("authToken");
                    removeCookies("userData");
                    window.location.href = `/consultant/vacation?message=${encodeURIComponent(error?.response?.data?.message || "Aproveite seu descanso, nos vemos na volta!")}`;
                    return;
                }
                if (code === "TERMS_ACCEPTANCE_REQUIRED") {
                    window.location.href = "/terms-acceptance";
                    return;
                }
                console.error("Error fetching userData:", error)
            }
        }

        fetchUserRole();
        const timer = window.setInterval(fetchUserRole, 30000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 769) {
                setMobileOpen(false);
            }
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={`admin-menubar ${mobileOpen ? "mobile-open" : ""}`}>
            <div className="admin-menubar-mobile-bar">
                <a href="/consultant" className="admin-menubar-mobile-brand" aria-label="Ir para início do painel do consultor">
                    <img src={paxIconWhite} className="pax-logo" alt="Hug" />
                </a>
                <button
                    type="button"
                    className="admin-menubar-mobile-toggle"
                    onClick={() => setMobileOpen(prev => !prev)}
                    aria-expanded={mobileOpen}
                    aria-label="Abrir menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <div className="admin-menubar-shell">
                <div className="logo-wrapper">
                    <img src={paxIconWhite} className="pax-logo" alt="Hug" />
                    <b>Olá {userName}!</b>
                </div>

                <div className="menu-wrapper">
                    <a href="/consultant" className={pathname.endsWith("/consultant") ? "menu-link selected" : "menu-link"}>
                        <img src={homeIcon} alt="" />
                        <span>Início</span>
                    </a>

                    <a href="/consultant/colleges" className={pathname.includes("/consultant/colleges") ? "menu-link selected" : "menu-link"}>
                        <svg height="18" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 5L11 1L1 5L11 9L21 5ZM21 5V11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M5 6.60001V12C5 12.7957 5.63214 13.5587 6.75736 14.1213C7.88258 14.6839 9.4087 15 11 15C12.5913 15 14.1174 14.6839 15.2426 14.1213C16.3679 13.5587 17 12.7957 17 12V6.60001" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Escolas</span>
                    </a>

                    <a href="/consultant/educators" className={pathname.includes("/consultant/educators") ? "menu-link selected" : "menu-link"}>
                         <img src={personIcon} alt="" />
                        <span>Educadores</span>
                    </a>

                    <PageSelector />
                    
                <button id="logout" onClick={doLogout}>
                    <svg height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.6277 19.1415V21.0947C17.6277 23.2487 15.8754 25.0011 13.7213 25.0011L3.90642 25.0011C1.75236 25.0011 0 23.2487 0 21.0947L0 3.90642C0 1.75236 1.75236 0 3.90642 0L13.7213 0C15.8754 0 17.6277 1.75236 17.6277 3.90642V5.85963C17.6277 6.39905 17.1905 6.83624 16.6511 6.83624C16.1117 6.83624 15.6745 6.39905 15.6745 5.85963V3.90642C15.6745 2.82949 14.7982 1.95321 13.7213 1.95321L3.90642 1.95321C2.82949 1.95321 1.95321 2.82949 1.95321 3.90642L1.95321 21.0947C1.95321 22.1716 2.82949 23.0479 3.90642 23.0479L13.7213 23.0479C14.7982 23.0479 15.6745 22.1716 15.6745 21.0947L15.6745 19.1415C15.6745 18.602 16.1117 18.1649 16.6511 18.1649C17.1905 18.1649 17.6277 18.602 17.6277 19.1415ZM24.286 10.823L22.0991 8.63609C21.7176 8.2546 21.0993 8.2546 20.718 8.63609C20.3365 9.01739 20.3365 9.63578 20.718 10.0171L22.2735 11.5728L10.5473 11.5728C10.0079 11.5728 9.57073 12.01 9.57073 12.5494C9.57073 13.0888 10.0079 13.526 10.5473 13.526L22.2735 13.526L20.718 15.0817C20.3365 15.463 20.3365 16.0814 20.718 16.4627C20.9087 16.6534 21.1586 16.7488 21.4084 16.7488C21.6585 16.7488 21.9084 16.6534 22.0991 16.4627L24.286 14.2758C25.238 13.3238 25.238 11.775 24.286 10.823Z" fill="white"/>
                    </svg>
                </button>
                </div>
            </div>
        </div>
    )
}

export default Menubar
