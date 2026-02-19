import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCookies } from "../controllers/misc/cookies.controller";
import { getHelpdeskOpenCount } from "../controllers/helpdesk/helpdeskLocal.controller";
import HelpdeskUserPanel from "./helpdeskUserPanel";
import "../style/helpdeskWidget.css";

const HIDDEN_ROUTES = [
  "/",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/terms-and-conditions",
  "/terms-acceptance",
  "/consultant/vacation",
];

function HelpdeskWidget() {
  const location = useLocation();
  const [openCount, setOpenCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isHidden = useMemo(() => {
    if (HIDDEN_ROUTES.includes(location.pathname)) {
      return true;
    }
    if (!getCookies("authToken")) {
      return true;
    }
    if (location.pathname.startsWith("/admin")) {
      return true;
    }
    return false;
  }, [location.pathname]);

  useEffect(() => {
    if (isHidden) return;
    let mounted = true;
    async function loadCount() {
      try {
        const count = await getHelpdeskOpenCount();
        if (mounted) setOpenCount(count);
      } catch {
        if (mounted) setOpenCount(0);
      }
    }
    void loadCount();
    const timer = window.setInterval(() => {
      void loadCount();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isHidden, location.pathname]);

  if (isHidden) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="helpdesk-widget"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Central de Helpdesk"
        >
          <span className="helpdesk-widget-icon">?</span>
          <span className="helpdesk-widget-label">Suporte</span>
          {openCount > 0 && <span className="helpdesk-widget-badge">{openCount > 99 ? "99+" : openCount}</span>}
        </button>
      )}

      {isOpen && (
        <div className="helpdesk-widget-overlay" onClick={() => setIsOpen(false)}>
          <div className="helpdesk-widget-modal" onClick={(e) => e.stopPropagation()}>
            <HelpdeskUserPanel isPopup onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default HelpdeskWidget;
