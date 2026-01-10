import React, { useState, useEffect, useRef } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";

import "../style/pageSelector.css";

function PageSelector() {
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
            <button className="page-selector-btn" onClick={() => setOpen(prev => !prev)} >
                🔀
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