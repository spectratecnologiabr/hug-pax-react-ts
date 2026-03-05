import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

function normalizeErrorMessage(reason: any) {
  if (axios.isAxiosError(reason)) {
    const status = Number(reason.response?.status || 0);
    const apiMessage = String(reason.response?.data?.message || "").trim();

    if (status >= 500) {
      return "Ocorreu um erro interno. Tente novamente em alguns instantes.";
    }

    return apiMessage || "Não foi possível concluir a operação no momento.";
  }

  if (reason instanceof Error) {
    return reason.message || "Ocorreu um erro inesperado.";
  }

  return "Ocorreu um erro inesperado.";
}

function extractReason(payload: any) {
  if (!payload) return payload;
  if (payload.reason !== undefined) return payload.reason;
  if (payload.error !== undefined) return payload.error;
  return payload;
}

export default function GlobalRuntimeGuard() {
  const [open, setOpen] = useState(false);
  const [isError, setIsError] = useState(true);
  const [message, setMessage] = useState("");
  const hideTimer = useRef<number | null>(null);

  function openErrorModal(text: string) {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);

    setIsError(true);
    setMessage(text);
    setOpen(true);

    hideTimer.current = window.setTimeout(() => {
      setOpen(false);
    }, 5000);
  }

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = extractReason(event.reason);
      openErrorModal(normalizeErrorMessage(reason));
      event.preventDefault();
    };

    const onWindowError = (event: ErrorEvent) => {
      const reason = extractReason((event as any).error ?? event.message);
      openErrorModal(normalizeErrorMessage(reason));
      event.preventDefault();
      return true;
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onWindowError);

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, []);

  return (
    <div className={`warning-container ${isError ? "error" : "success"} ${open ? "open" : ""}`}>
      <button onClick={() => setOpen(false)} aria-label="Fechar aviso">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" />
        </svg>
      </button>
      <span>{message}</span>
    </div>
  );
}
