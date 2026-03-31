import React from "react";
import PageSelector from "./pageSelector";
import { getCookies } from "../controllers/misc/cookies.controller";

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
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const userData = getCookies("userData") as { role?: string } | undefined;
    const isStudentContext = userData?.role === "student" || pathname.startsWith("/student");
    const homePath = isStudentContext ? "/student/materials" : "/dashboard";
    const formationIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 0 24 24" fill="none" className="menu-icon formation-menu-icon">
            <path d="M3.5 9.5L12 5L20.5 9.5L12 14L3.5 9.5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M7 11.75V15.25C7 16.2165 9.23858 18 12 18C14.7614 18 17 16.2165 17 15.25V11.75" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.5 10V15.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M20.5 18.5C21.0523 18.5 21.5 18.0523 21.5 17.5C21.5 16.9477 21.0523 16.5 20.5 16.5C19.9477 16.5 19.5 16.9477 19.5 17.5C19.5 18.0523 19.9477 18.5 20.5 18.5Z" fill="white"/>
        </svg>
    );
    const activeEducatorSection = typeof window !== "undefined"
        ? window.sessionStorage.getItem("educatorCourseSection")
        : null;
    const menuItems = isStudentContext
        ? [
            {
                href: "/student/materials",
                title: "Materiais Didáticos",
                label: "Materiais",
                icon: <img src={hatIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/student/materials") || pathname.startsWith("/student/course/")
            }
        ]
        : [
            {
                href: "/dashboard",
                title: "Dashboard",
                label: "Dashboard",
                icon: <img src={homeIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/dashboard")
            },
            {
                href: "/courses",
                title: "Materiais Pedagógicos",
                label: "Pedagógicos",
                icon: <img src={hatIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/courses") || (pathname.startsWith("/course/") && activeEducatorSection === "teacher_material")
            },
            {
                href: "/formations",
                title: "Formações",
                label: "Formações",
                icon: formationIcon,
                active: pathname.startsWith("/formations") || (pathname.startsWith("/course/") && activeEducatorSection === "course")
            },
            {
                href: "/profile",
                title: "Meu Perfil",
                label: "Meu Perfil",
                icon: <img src={personIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/profile")
            },
            {
                href: "/certificates",
                title: "Meus Certificados",
                label: "Certificados",
                icon: <img src={certIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/certificates")
            },
            {
                href: "/helpdesk",
                title: "Helpdesk",
                label: "Helpdesk",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" height="25" viewBox="0 0 24 24" fill="none" className="menu-icon">
                        <path d="M8.5 9.5H15.5M8.5 13H12.5M7 20L3.5 21V5.5C3.5 4.67157 4.17157 4 5 4H19C19.8284 4 20.5 4.67157 20.5 5.5V16.5C20.5 17.3284 19.8284 18 19 18H9.5L7 20Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                ),
                active: pathname.startsWith("/helpdesk")
            },
            {
                href: "/notifications",
                title: "Notificações",
                label: "Notificações",
                icon: <img src={notificationIcon} alt="" className="menu-icon" />,
                active: pathname.startsWith("/notifications")
            }
        ];

    React.useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 769) {
                setMobileOpen(false);
            }
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={`aside-container ${mobileOpen ? "mobile-open" : ""}`}>
            <div className="aside-mobile-bar">
                <a href={homePath} className="aside-mobile-brand" aria-label="Ir para página inicial do módulo">
                    <img src={mainIconWhite} alt="Hug" className="main-logo-mob" />
                </a>
                <button
                    type="button"
                    className="aside-mobile-toggle"
                    onClick={() => setMobileOpen(prev => !prev)}
                    aria-expanded={mobileOpen}
                    aria-label="Abrir menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <div className="aside-menu-shell">
                <div className="menu-wrapper">
                    <img src={mainIcon} alt="main-logo" className="main-logo" />

                    {menuItems.map((item) => (
                        <a href={item.href} className={item.active ? "menu-item active" : "menu-item"} title={item.title} key={item.href}>
                            {item.icon}
                            <span className="menu-label">{item.label}</span>
                            {!isStudentContext && item.href === "/notifications" && props.notificationCount > 0 && (
                                <span className="notification-count">
                                    {props.notificationCount > 9 ? "9+" : props.notificationCount}
                                </span>
                            )}
                        </a>
                    ))}
                    {userData?.role !== "student" && <PageSelector title />}
                </div>

                <button className="logout-button" onClick={doLogout}>
                    <img src={logoutIcon} alt="" />
                </button>
            </div>
        </div>
    )
}

export default AsideMenu;
