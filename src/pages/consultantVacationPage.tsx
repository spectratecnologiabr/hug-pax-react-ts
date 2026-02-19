import React, { useMemo } from "react";
import "../style/consultantVacationPage.css";

function ConsultantVacationPage() {
  const message = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("message");
    return raw?.trim() || "Aproveite seu descanso, nos vemos na volta!";
  }, []);

  return (
    <div className="vacation-page">
      <div className="vacation-card">
        <span className="vacation-kicker">Modo Férias</span>
        <h1>{message}</h1>
        <p>
          Seu acesso de consultor está pausado temporariamente.
          Assim que o período terminar, o administrador poderá reativar seu acesso.
        </p>
        <a href="/login" className="vacation-link">
          Voltar para login
        </a>
      </div>
    </div>
  );
}

export default ConsultantVacationPage;
