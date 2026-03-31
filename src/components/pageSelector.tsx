import React, { useState, useEffect, useRef } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

import "../style/pageSelector.css";

type TRole = "educator" | "student" | "consultant" | "coordinator" | "specialist_consultant" | "admin";
type TModuleKey = "educator" | "student" | "consultant" | "coordinator" | "admin";

const MODULE_OPTIONS: Array<{
    key: TModuleKey;
    label: string;
    description: string;
    icon: string;
    path: string;
    allowedRoles: TRole[];
}> = [
    {
        key: "educator",
        label: "AVA",
        description: "Ambiente do educador",
        icon: "🎓",
        path: "/dashboard",
        allowedRoles: ["educator", "consultant", "coordinator", "specialist_consultant", "admin"]
    },
    {
        key: "student",
        label: "AVA Aluno",
        description: "Ambiente do aluno",
        icon: "📘",
        path: "/student/materials",
        allowedRoles: ["student", "educator", "consultant", "coordinator", "specialist_consultant", "admin"]
    },
    {
        key: "consultant",
        label: "Painel Consultor",
        description: "Acompanhamento de rede e educadores",
        icon: "🧭",
        path: "/consultant",
        allowedRoles: ["consultant", "coordinator", "specialist_consultant", "admin"]
    },
    {
        key: "coordinator",
        label: "Painel Coordenador",
        description: "Visao consolidada da coordenacao",
        icon: "📊",
        path: "/coordinator",
        allowedRoles: ["coordinator", "specialist_consultant", "admin"]
    },
    {
        key: "admin",
        label: "Painel Administrador",
        description: "Configuracoes e operacao da plataforma",
        icon: "🛠️",
        path: "/admin",
        allowedRoles: ["admin"]
    }
];

function PageSelector(props: {title?: boolean}) {
    const user = getCookies("userData");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupAlign, setPopupAlign] = useState<"left" | "right">("left");
    const [popupVerticalAlign, setPopupVerticalAlign] = useState<"top" | "bottom">("bottom");
    const [mobilePopupStyle, setMobilePopupStyle] = useState<React.CSSProperties>({});
    const [ userRole, setUserRole ] = useState<TRole | null>(null);

    useEffect(() => {
        async function fetchUserRole() {
            try {
                const sessionData = await checkSession();
                setUserRole(sessionData.session.role);
            } catch (error) {
                console.error("Error fetching userData:", error)
            }
        }

        fetchUserRole();
    }, []); 

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) return;

        function adjustPopupAlignment() {
            const container = containerRef.current;
            const popup = popupRef.current;
            if (!container || !popup) return;

            const containerRect = container.getBoundingClientRect();
            const rect = popup.getBoundingClientRect();
            const viewportPadding = 12;
            const gap = 8;
            const isMobile = window.innerWidth <= 769;

            const popupHeight = popup.offsetHeight || rect.height || 0;
            const shouldOpenTop =
                containerRect.bottom + gap + popupHeight > window.innerHeight - viewportPadding
                && containerRect.top - gap - popupHeight >= viewportPadding;

            if (!isMobile && rect.right > window.innerWidth - viewportPadding) {
                setPopupAlign("right");
            } else if (!isMobile && rect.left < viewportPadding) {
                setPopupAlign("left");
            }

            setPopupVerticalAlign(shouldOpenTop ? "top" : "bottom");

            if (isMobile) {
                const popupWidth = Math.min(containerRect.width, window.innerWidth - viewportPadding * 2);
                const left = Math.min(
                    Math.max(viewportPadding, containerRect.left),
                    window.innerWidth - popupWidth - viewportPadding
                );
                const top = shouldOpenTop
                    ? Math.max(viewportPadding, containerRect.top - popupHeight - gap)
                    : Math.min(window.innerHeight - popupHeight - viewportPadding, containerRect.bottom + gap);

                setMobilePopupStyle({
                    position: "fixed",
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${popupWidth}px`,
                    maxWidth: `${popupWidth}px`
                });
                return;
            }

            setMobilePopupStyle({});
        }

        adjustPopupAlignment();
        window.addEventListener("resize", adjustPopupAlignment);
        window.addEventListener("scroll", adjustPopupAlignment, true);
        return () => {
            window.removeEventListener("resize", adjustPopupAlignment);
            window.removeEventListener("scroll", adjustPopupAlignment, true);
        };
    }, [open]);

    const activeRole = (userRole ?? user?.role) as TRole | undefined;
    const availableModules = MODULE_OPTIONS.filter(option =>
        activeRole ? option.allowedRoles.includes(activeRole) : false
    );
    const shouldRenderSelector = availableModules.length > 1;

    function handleRedirect(path: string) {
        window.location.href = path;
    }

    return (
        shouldRenderSelector ?
        <div className="page-selector" ref={containerRef}>
            <button className="page-selector-btn" onClick={() => setOpen(prev => !prev)} title="Mudar Módulo">
                <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1L19 4L16 7" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 17L19 14L16 11" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 4H4C5.32608 4 6.59785 4.52678 7.53553 5.46447C8.47322 6.40215 9 7.67392 9 9C9 10.3261 9.52678 11.5979 10.4645 12.5355C11.4021 13.4732 12.6739 14 14 14H19" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 13.001C6.13494 13.6508 5.08192 14.0015 4 14H1M19 4.00001H14C12.9188 3.99827 11.8664 4.34859 11.002 4.99801L19 4.00001Z" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>

                {props.title ? <span>Mudar Módulo</span> : null}
            </button>

            <div
                ref={popupRef}
                className={`page-selector-popup ${open ? "active" : ""} ${popupAlign === "right" ? "align-right" : "align-left"} ${popupVerticalAlign === "top" ? "align-top" : "align-bottom"}`}
                style={mobilePopupStyle}
            >
                {availableModules.map(option => (
                    <div
                        key={option.key}
                        className="popup-option"
                        onClick={() => handleRedirect(option.path)}
                    >
                        {option.icon} {option.label}
                        <span>{option.description}</span>
                    </div>
                ))}
            </div>
        </div> : null
    )
}

export default PageSelector;
