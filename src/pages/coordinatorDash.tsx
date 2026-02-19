import React, { useEffect, useState } from "react";
import CoordinatorMenubar from "../components/coordinator/menubar";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listEducators } from "../controllers/user/listEducators.controller";

import "../style/adminDash.css";
import "../style/coordinatorDash.css";

type TOverviewData = {
  unreadNotifications: number;
};

function CoordinatorDash() {
  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ consultants: 0, colleges: 0, educators: 0 });

  function formatMetric(value?: number) {
    return Number(value ?? 0).toLocaleString("pt-BR");
  }

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const [overview, consultants, colleges, educators] = await Promise.all([
          getOverviewData(),
          listConsultants(),
          listColleges(),
          listEducators(),
        ]);

        setOverviewData(overview as TOverviewData);
        setStats({
          consultants: Array.isArray(consultants) ? consultants.length : 0,
          colleges: Array.isArray(colleges) ? colleges.length : 0,
          educators: Array.isArray(educators) ? educators.length : 0,
        });
      } catch (error) {
        console.error("Coordinator dashboard bootstrap error:", error);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  return (
    <div className="admin-dashboard-container coordinator-dash-page">
      <CoordinatorMenubar />

      <div className="admin-dashboard-wrapper coordinator-dash-wrapper">
        <div className="admin-header-wrapper">
          <div>
            <b>Painel do Coordenador</b>
            <span>Visão consolidada da sua regional para consultores, escolas, educadores e indicadores gerais.</span>
          </div>
        </div>

        <div className="main-dash-wrapper coordinator-main-dash">
          <div className="row">
            <div className="cards-list">
          <div className="card-item">
            <div className="img-wrapper">
              <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.69644 11.596C9.84318 11.596 10.9642 11.256 11.9176 10.6189C12.8711 9.98177 13.6143 9.07625 14.0531 8.0168C14.4919 6.95736 14.6068 5.79157 14.383 4.66687C14.1593 3.54217 13.6071 2.50906 12.7962 1.6982C11.9854 0.887333 10.9523 0.335127 9.82757 0.11141C8.70287 -0.112308 7.53709 0.00251219 6.47764 0.441349C5.41819 0.880186 4.51267 1.62333 3.87558 2.57681C3.23848 3.53028 2.89844 4.65127 2.89844 5.79801C2.89997 7.33526 3.51132 8.80911 4.59833 9.89612C5.68533 10.9831 7.15919 11.5945 8.69644 11.596ZM8.69644 1.93267C9.46093 1.93267 10.2083 2.15937 10.8439 2.5841C11.4796 3.00882 11.975 3.61251 12.2675 4.31881C12.5601 5.0251 12.6366 5.80229 12.4875 6.55209C12.3384 7.3019 11.9702 7.99063 11.4296 8.53121C10.8891 9.07179 10.2003 9.43992 9.45053 9.58907C8.70073 9.73821 7.92354 9.66167 7.21724 9.36911C6.51094 9.07655 5.90726 8.58112 5.48253 7.94547C5.0578 7.30982 4.83111 6.5625 4.83111 5.79801C4.83111 4.77285 5.23834 3.78969 5.96324 3.0648C6.68813 2.33991 7.67129 1.93267 8.69644 1.93267Z" fill="#89A626"/>
                      <path d="M8.697 13.5293C6.3912 13.5319 4.18057 14.449 2.55012 16.0794C0.919668 17.7099 0.00255774 19.9205 0 22.2263C0 22.4826 0.10181 22.7284 0.283033 22.9096C0.464255 23.0908 0.710046 23.1926 0.966334 23.1926C1.22262 23.1926 1.46841 23.0908 1.64963 22.9096C1.83086 22.7284 1.93267 22.4826 1.93267 22.2263C1.93267 20.4323 2.64534 18.7118 3.9139 17.4432C5.18245 16.1746 6.90299 15.462 8.697 15.462C10.491 15.462 12.2116 16.1746 13.4801 17.4432C14.7487 18.7118 15.4613 20.4323 15.4613 22.2263C15.4613 22.4826 15.5631 22.7284 15.7444 22.9096C15.9256 23.0908 16.1714 23.1926 16.4277 23.1926C16.684 23.1926 16.9298 23.0908 17.111 22.9096C17.2922 22.7284 17.394 22.4826 17.394 22.2263C17.3914 19.9205 16.4743 17.7099 14.8439 16.0794C13.2134 14.449 11.0028 13.5319 8.697 13.5293Z" fill="#89A626"/>
                  </svg>
                </div>
                <b>{loading ? "—" : formatMetric(stats.consultants)}</b>
                <span>CONSULTORES</span>
              </div>

              <div className="card-item">
                <div className="img-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M19 21H14M5 21L3 21M5 21H10M9 6.99998H10M9 11H10M14 6.99998H15M14 11H15M10 21V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V21M10 21H14" stroke="#89A626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <b>{loading ? "—" : formatMetric(stats.colleges)}</b>
                <span>ESCOLAS</span>
              </div>

              <div className="card-item">
                <div className="img-wrapper">
                  <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.69644 11.596C9.84318 11.596 10.9642 11.256 11.9176 10.6189C12.8711 9.98177 13.6143 9.07625 14.0531 8.0168C14.4919 6.95736 14.6068 5.79157 14.383 4.66687C14.1593 3.54217 13.6071 2.50906 12.7962 1.6982C11.9854 0.887333 10.9523 0.335127 9.82757 0.11141C8.70287 -0.112308 7.53709 0.00251219 6.47764 0.441349C5.41819 0.880186 4.51267 1.62333 3.87558 2.57681C3.23848 3.53028 2.89844 4.65127 2.89844 5.79801C2.89997 7.33526 3.51132 8.80911 4.59833 9.89612C5.68533 10.9831 7.15919 11.5945 8.69644 11.596ZM8.69644 1.93267C9.46093 1.93267 10.2083 2.15937 10.8439 2.5841C11.4796 3.00882 11.975 3.61251 12.2675 4.31881C12.5601 5.0251 12.6366 5.80229 12.4875 6.55209C12.3384 7.3019 11.9702 7.99063 11.4296 8.53121C10.8891 9.07179 10.2003 9.43992 9.45053 9.58907C8.70073 9.73821 7.92354 9.66167 7.21724 9.36911C6.51094 9.07655 5.90726 8.58112 5.48253 7.94547C5.0578 7.30982 4.83111 6.5625 4.83111 5.79801C4.83111 4.77285 5.23834 3.78969 5.96324 3.0648C6.68813 2.33991 7.67129 1.93267 8.69644 1.93267Z" fill="#89A626"/>
                      <path d="M8.697 13.5293C6.3912 13.5319 4.18057 14.449 2.55012 16.0794C0.919668 17.7099 0.00255774 19.9205 0 22.2263C0 22.4826 0.10181 22.7284 0.283033 22.9096C0.464255 23.0908 0.710046 23.1926 0.966334 23.1926C1.22262 23.1926 1.46841 23.0908 1.64963 22.9096C1.83086 22.7284 1.93267 22.4826 1.93267 22.2263C1.93267 20.4323 2.64534 18.7118 3.9139 17.4432C5.18245 16.1746 6.90299 15.462 8.697 15.462C10.491 15.462 12.2116 16.1746 13.4801 17.4432C14.7487 18.7118 15.4613 20.4323 15.4613 22.2263C15.4613 22.4826 15.5631 22.7284 15.7444 22.9096C15.9256 23.0908 16.1714 23.1926 16.4277 23.1926C16.684 23.1926 16.9298 23.0908 17.111 22.9096C17.2922 22.7284 17.394 22.4826 17.394 22.2263C17.3914 19.9205 16.4743 17.7099 14.8439 16.0794C13.2134 14.449 11.0028 13.5319 8.697 13.5293Z" fill="#89A626"/>
                  </svg>
                </div>
            <b>{loading ? "—" : formatMetric(stats.educators)}</b>
            <span>EDUCADORES</span>
          </div>
            </div>
          </div>

          <div className="coord-shortcuts">
            <a href="/coordinator/agenda" className="coord-shortcut-card">
              <b>Gestão de Agendas</b>
              <span>Visualizar e acompanhar visitas por período.</span>
            </a>
            <a href="/coordinator/consultants" className="coord-shortcut-card">
              <b>Gestão de Consultores</b>
              <span>Status, férias e controle por regional.</span>
            </a>
            <a href="/coordinator/colleges" className="coord-shortcut-card">
              <b>Escolas e Educadores</b>
              <span>Cadastros da regional com vínculo de consultor.</span>
            </a>
            <a href="/coordinator/educators" className="coord-shortcut-card">
              <b>Perfis de Educadores</b>
              <span>Consulta e manutenção de dados dos educadores.</span>
            </a>
            <a href="/coordinator/reports-center" className="coord-shortcut-card">
              <b>Central de Relatórios</b>
              <span>Histórico consolidado de visitas e escolas.</span>
            </a>
            <a href="/coordinator/certificates" className="coord-shortcut-card">
              <b>Certificados</b>
              <span>Validação e rastreabilidade de certificados.</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorDash;
