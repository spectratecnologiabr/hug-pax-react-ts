import React from "react";
import CoordinatorMenubar from "../components/coordinator/menubar";
import "../style/adminDash.css";

function resolveTitle(pathname: string) {
  if (pathname.includes("/coordinator/agenda")) return "Gestão de Agendas";
  if (pathname.includes("/coordinator/consultants")) return "Gestão de Consultores";
  if (pathname.includes("/coordinator/colleges")) return "Escolas e Educadores";
  if (pathname.includes("/coordinator/educators")) return "Perfis de Educadores";
  if (pathname.includes("/coordinator/reports-center")) return "Central de Relatórios";
  return "Módulo do Coordenador";
}

function CoordinatorModulePage() {
  const pathname = window.location.pathname;
  const title = resolveTitle(pathname);

  return (
    <div className="admin-dashboard-container">
      <CoordinatorMenubar />

      <div className="admin-dashboard-wrapper">
        <div className="admin-header-wrapper">
          <div>
            <b>{title}</b>
            <span>Estrutura inicial do módulo do coordenador pronta para integração de dados e regras de escopo.</span>
          </div>
        </div>

        <div style={{ margin: "0 20px", background: "#fff", border: "1px solid #e6ebf2", borderRadius: 12, padding: 16 }}>
          <p style={{ margin: 0, color: "#475467", fontSize: 14 }}>
            Próximo passo: ligar esta tela aos endpoints coordenador com ACL e escopo de rede.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorModulePage;
