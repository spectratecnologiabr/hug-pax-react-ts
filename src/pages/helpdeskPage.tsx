import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import AsideMenu from "../components/asideMenu";
import HelpdeskUserPanel from "../components/helpdeskUserPanel";
import Footer from "../components/footer";
import "../style/helpdeskPage.css";

type TOverviewData = {
  unreadNotifications: number;
};

function HelpdeskPage() {
  const navigate = useNavigate();
  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getOverviewData();
        setOverviewData(data);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      }
    })();
  }, []);

  return (
    <>
      <div className="helpdesk-page-container">
        <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)} />

        <div className="helpdesk-page-wrapper">
          <div className="helpdesk-header">
            <div>
              <h1>Central de Helpdesk</h1>
              <p>Sistema de abertura de tickets técnico e pedagógico com histórico de conversa e status de chamado.</p>
            </div>
            <button type="button" className="helpdesk-back" onClick={() => navigate(-1)}>
              Voltar
            </button>
          </div>

          <div className="helpdesk-standalone">
            <HelpdeskUserPanel />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HelpdeskPage;
