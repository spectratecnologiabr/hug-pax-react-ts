import React, { useState, useEffect, useRef } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";

import "../style/pageSelector.css";

function PageSelector(props: {title?: boolean}) {
    const user = getCookies("userData");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const userRole = user.role;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setOpen(false);
        }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleRedirect(target: "ava" | "admin") {
        if (target === "ava") {
        window.location.href = "/dashboard";
        }

        if (target === "admin") {
        window.location.href = "/admin";
        }
    }

    return (
        user.role !== "educator" ?
        <div className="page-selector" ref={containerRef}>
            <button className="page-selector-btn" onClick={() => setOpen(prev => !prev)} title="Mudar Módulo">
                <svg height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.17 14.76L15.07 13.66C15.78 12.33 15.6 10.65 14.48 9.53C13.79 8.84 12.9 8.5 12 8.5C11.97 8.5 11.94 8.51 11.91 8.51L13 9.6L11.94 10.66L9.11 7.83L11.94 5L13 6.06L12.04 7.02C13.31 7.03 14.57 7.5 15.54 8.46C17.24 10.17 17.45 12.82 16.17 14.76ZM14.89 16.17L12.06 19L11 17.94L11.95 16.99C10.69 16.98 9.43 16.49 8.47 15.53C6.76 13.82 6.55 11.18 7.83 9.24L8.93 10.34C8.22 11.67 8.4 13.35 9.52 14.47C10.22 15.17 11.15 15.51 12.08 15.48L11 14.4L12.06 13.34L14.89 16.17Z" fill="white"/>
                </svg>
                {props.title ? <span>Mudar Módulo</span> : null}
            </button>

            <div className={`page-selector-popup ${open ? "active" : ""}`}>
                <div className="popup-option" onClick={() => handleRedirect("ava")}>
                    🎓 AVA
                    <span>Ambiente do aluno</span>
                </div>

                <div className="popup-option" onClick={() => handleRedirect("admin")}>
                    🛠️ Painel Admin
                    <span>Área administrativa</span>
                </div>
            </div>
        </div> : null
    )
}

export default PageSelector;