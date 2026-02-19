import React, { useState, useEffect, useRef } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

import "../style/pageSelector.css";

type TRole = 'consultant' | 'coordinator' | 'admin'

function PageSelector(props: {title?: boolean}) {
    const user = getCookies("userData");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupAlign, setPopupAlign] = useState<"left" | "right">("left");
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
            const popup = popupRef.current;
            if (!popup) return;

            const rect = popup.getBoundingClientRect();
            const viewportPadding = 12;

            if (rect.right > window.innerWidth - viewportPadding) {
                setPopupAlign("right");
                return;
            }

            if (rect.left < viewportPadding) {
                setPopupAlign("left");
                return;
            }
        }

        adjustPopupAlignment();
        window.addEventListener("resize", adjustPopupAlignment);
        return () => window.removeEventListener("resize", adjustPopupAlignment);
    }, [open]);

    function handleRedirect(target: "ava" | "admin") {
        if (target === "ava") {
        window.location.href = "/dashboard";
        }

        if (target === "admin") {
            switch(userRole) {
                case "consultant":
                     window.location.href = "/consultant";
                     break;
                case "coordinator":
                     window.location.href = "/coordinator";
                     break;
                default:
                    window.location.href = "/admin";
                    break;

            }
        }
    }

    return (
        user.role !== "educator" ?
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

            <div ref={popupRef} className={`page-selector-popup ${open ? "active" : ""} ${popupAlign === "right" ? "align-right" : "align-left"}`}>
                <div className="popup-option" onClick={() => handleRedirect("ava")}>
                    🎓 AVA
                    <span>Ambiente do aluno</span>
                </div>

                <div className="popup-option" onClick={() => handleRedirect("admin")}>
                    🛠️ Painel {userRole === "consultant" ? "Consultor" : userRole === "coordinator" ? "Coordenador" : userRole === "admin" ? "Administrador" : ""}
                    <span>Área administrativa</span>
                </div>
            </div>
        </div> : null
    )
}

export default PageSelector;
