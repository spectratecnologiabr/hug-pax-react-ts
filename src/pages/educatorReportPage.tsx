import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import AdminMenubar from "../components/admin/menubar";
import CoordinatorMenubar from "../components/coordinator/menubar";
import { getUserAdmin } from "../controllers/user/getUserAdmin.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { getLogDashboardList } from "../controllers/logs/getLogDashboardList.controller";
import { getLogDashboardEntry } from "../controllers/logs/getLogDashboardEntry.controller";

import "../style/adminReportsCenterPage.css";

type TUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  management?: string;
  collegeId?: number | null;
  isActive?: boolean;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type TCollege = { id: number; name: string };
type TLogItem = {
  id: number;
  level?: string;
  module?: string;
  ip?: string;
  userName?: string;
  createdAt?: string;
  name?: string;
  message?: string;
  metadata?: Record<string, any> | null;
};

type TDetailsModal = {
  open: boolean;
  log: TLogItem | null;
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function normalizeLevel(level?: string): "info" | "warning" | "error" | "debug" {
  const value = String(level ?? "").toLowerCase();
  if (value === "warn" || value === "warning") return "warning";
  if (value === "fatal" || value === "error" || value === "critical") return "error";
  if (value === "debug") return "debug";
  return "info";
}

function levelLabel(level?: string) {
  const normalized = normalizeLevel(level);
  if (normalized === "warning") return "Aviso";
  if (normalized === "error") return "Erro";
  if (normalized === "debug") return "Debug";
  return "Info";
}

function levelPillStyle(level?: string): React.CSSProperties {
  const normalized = normalizeLevel(level);
  if (normalized === "warning") return { background: "#fdf2df", color: "#b7791f", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 };
  if (normalized === "error") return { background: "#fde8e8", color: "#c53030", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 };
  if (normalized === "debug") return { background: "#f0f2f5", color: "#57606f", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 };
  return { background: "#e7f4fd", color: "#197db5", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 };
}

function EducatorReportPage() {
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator");
  const { educatorId } = useParams<{ educatorId: string }>();
  const parsedEducatorId = Number(educatorId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TUser | null>(null);
  const [colleges, setColleges] = useState<TCollege[]>([]);
  const [logs, setLogs] = useState<TLogItem[]>([]);
  const [detailsModal, setDetailsModal] = useState<TDetailsModal>({ open: false, log: null });
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(parsedEducatorId) || parsedEducatorId <= 0) {
        setError("Educador inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [userData, collegesData] = await Promise.all([
          getUserAdmin(parsedEducatorId),
          listColleges(),
        ]);

        if (cancelled) return;

        setUser(userData as TUser);
        setColleges(Array.isArray(collegesData) ? collegesData : []);

        const logsData = await getLogDashboardList({
          userId: parsedEducatorId,
          limit: 50,
        });
        const list = Array.isArray((logsData as any)?.items)
          ? (logsData as any).items
          : Array.isArray(logsData)
            ? logsData
            : [];

        if (!cancelled) {
          setLogs(list as TLogItem[]);
        }
      } catch {
        if (cancelled) return;
        setError("Falha ao carregar o relatório do educador.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [parsedEducatorId]);

  const schoolName = useMemo(() => {
    const schoolId = Number(user?.collegeId);
    if (!Number.isFinite(schoolId) || schoolId <= 0) return "Sem escola";
    const match = colleges.find((item) => Number(item.id) === schoolId);
    return match?.name || `Escola #${schoolId}`;
  }, [user, colleges]);

  const fullName = `${String(user?.firstName || "").trim()} ${String(user?.lastName || "").trim()}`.trim();
  const status = user?.isBlocked ? "Bloqueado" : user?.isActive ? "Ativo" : "Inativo";

  function extractChangedData(log: TLogItem) {
    const meta = log?.metadata ?? {};
    if (Array.isArray(meta?.fields) && meta.fields.length > 0) {
      return `Campos: ${meta.fields.join(", ")}`;
    }
    if (meta?.patch && typeof meta.patch === "object") {
      return JSON.stringify(meta.patch);
    }
    if (meta?.data && typeof meta.data === "object") {
      return JSON.stringify(meta.data);
    }
    return "-";
  }

  function extractUserName(log: TLogItem) {
    const meta = log?.metadata ?? {};
    return String(log.userName ?? meta.userName ?? (meta.userId ? `Usuário #${meta.userId}` : "Sistema"));
  }

  function extractModule(log: TLogItem) {
    const meta = log?.metadata ?? {};
    return String(log.module ?? meta.module ?? "Sistema");
  }

  function extractIp(log: TLogItem) {
    const meta = log?.metadata ?? {};
    return String(log.ip ?? meta.ip ?? "-");
  }

  return (
    <div className="admin-dashboard-container reports-center-page">
      {isCoordinatorPanel ? <CoordinatorMenubar /> : <AdminMenubar />}

      <main className="reports-center-main">
        <header className="reports-center-header">
          <div>
            <h1>Relatório de Educador</h1>
            <p>Visualização somente leitura para análise do histórico cadastral.</p>
          </div>
          <div className="rc-badges">
            <button type="button" className="rc-view-link" onClick={() => window.history.back()}>
              Voltar
            </button>
            <span className="rc-badge">Somente leitura</span>
          </div>
        </header>

        {loading && <div className="rc-feedback">Carregando relatório...</div>}
        {!loading && error && <div className="rc-feedback rc-error">{error}</div>}

        {!loading && !error && user && (
          <>
            <section className="rc-table-wrap" aria-label="Relatório do educador">
              <table className="rc-table">
                <tbody>
                  <tr>
                    <th>Educador</th>
                    <td>{fullName || `#${user.id}`}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{user.email || "-"}</td>
                  </tr>
                  <tr>
                    <th>Unidade escolar</th>
                    <td>{schoolName}</td>
                  </tr>
                  <tr>
                    <th>Função</th>
                    <td>{user.role || "-"}</td>
                  </tr>
                  <tr>
                    <th>Gerência</th>
                    <td>{user.management || "-"}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{status}</td>
                  </tr>
                  <tr>
                    <th>Criado em</th>
                    <td>{formatDateTime(user.createdAt)}</td>
                  </tr>
                  <tr>
                    <th>Atualizado em</th>
                    <td>{formatDateTime(user.updatedAt)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section
              className="rc-table-wrap"
              aria-label="Histórico de alterações do perfil no sistema global de logs"
              style={{ marginTop: 14 }}
            >
              <table className="rc-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Ação</th>
                    <th>Módulo</th>
                    <th>Usuário</th>
                    <th>IP</th>
                    <th>Nível</th>
                    <th>Dados alterados</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td>{log.name || log.message || "-"}</td>
                      <td>{extractModule(log)}</td>
                      <td>{extractUserName(log)}</td>
                      <td>{extractIp(log)}</td>
                      <td>
                        <span style={levelPillStyle(log.level)}>{levelLabel(log.level)}</span>
                      </td>
                      <td>{extractChangedData(log)}</td>
                      <td>
                        <button
                          type="button"
                          className="rc-view-link"
                          onClick={async () => {
                            setDetailsLoading(true);
                            try {
                              const entry = await getLogDashboardEntry(log.id);
                              const parsed = Array.isArray(entry) ? entry[0] : entry;
                              setDetailsModal({ open: true, log: (parsed as TLogItem) ?? log });
                            } catch {
                              setDetailsModal({ open: true, log });
                            } finally {
                              setDetailsLoading(false);
                            }
                          }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="rc-empty">
                        Nenhum log de alteração encontrado para este usuário.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {detailsModal.open && detailsModal.log && (
              <div className="erp-modal-backdrop" onClick={() => setDetailsModal({ open: false, log: null })}>
                <div className="erp-modal-card" onClick={(event) => event.stopPropagation()}>
                  <div className="erp-modal-header">
                    <b>Detalhes do Log</b>
                    <button type="button" onClick={() => setDetailsModal({ open: false, log: null })}>×</button>
                  </div>
                  <div className="erp-modal-content">
                    {detailsLoading ? (
                      <div className="erp-modal-loading">Carregando detalhes...</div>
                    ) : (
                      <>
                        <div className="erp-modal-topline">
                          <span style={levelPillStyle(detailsModal.log.level)}>{levelLabel(detailsModal.log.level)}</span>
                          <span className="erp-modal-date">{formatDateTime(detailsModal.log.createdAt)}</span>
                        </div>

                        <div className="erp-modal-grid">
                          <div className="erp-modal-field">
                            <span>ID</span>
                            <b>{detailsModal.log.id ?? "—"}</b>
                          </div>
                          <div className="erp-modal-field">
                            <span>Evento</span>
                            <b>{detailsModal.log.name ?? "—"}</b>
                          </div>
                          <div className="erp-modal-field">
                            <span>Usuário</span>
                            <b>{extractUserName(detailsModal.log)}</b>
                          </div>
                          <div className="erp-modal-field">
                            <span>Módulo</span>
                            <b>{extractModule(detailsModal.log)}</b>
                          </div>
                          <div className="erp-modal-field">
                            <span>IP</span>
                            <b>{extractIp(detailsModal.log)}</b>
                          </div>
                        </div>

                        <div className="erp-modal-block">
                          <span>Mensagem</span>
                          <p>{detailsModal.log.message ?? "—"}</p>
                        </div>

                        <div className="erp-modal-block">
                          <span>Metadata</span>
                          <pre className="erp-modal-json">{JSON.stringify(detailsModal.log.metadata ?? {}, null, 2)}</pre>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default EducatorReportPage;
