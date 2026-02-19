import React, { useEffect, useMemo, useState } from "react";
import Menubar from "../components/admin/menubar";
import Footer from "../components/footer";
import { getLogDashboardList } from "../controllers/logs/getLogDashboardList.controller";
import { getLogDashboardFilterOptions } from "../controllers/logs/getLogDashboardFilterOptions.controller";
import { exportLogDashboardCsv } from "../controllers/logs/exportLogDashboardCsv.controller";
import { getLogDashboardEntry } from "../controllers/logs/getLogDashboardEntry.controller";

import "../style/adminLogsPage.css";

type TLogItem = {
  id?: number | string;
  level?: string;
  name?: string;
  message?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type TDetailsModal = {
  open: boolean;
  log: TLogItem | null;
};

function normalizeLevel(level?: string): "info" | "warning" | "error" | "debug" {
  const value = String(level ?? "").toLowerCase();
  if (value === "warn" || value === "warning") return "warning";
  if (value === "fatal" || value === "error") return "error";
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

function optionToString(option: any): string | null {
  if (typeof option === "string" || typeof option === "number") {
    const value = String(option).trim();
    return value || null;
  }

  if (option && typeof option === "object") {
    const value =
      option.label ??
      option.name ??
      option.module ??
      option.value ??
      option.key ??
      option.id;

    if (typeof value === "string" || typeof value === "number") {
      const normalized = String(value).trim();
      return normalized || null;
    }
  }

  return null;
}

function formatDateTime(value?: string) {
  if (!value) return "—";

  const raw = value.trim();
  const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw.replace(" ", "T")}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function mapLogsPayload(payload: any): TLogItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.timeline)) return payload.timeline;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function extractUser(log: TLogItem) {
  const metadata = log.metadata ?? {};
  return (
    metadata.userName ??
    metadata.actorName ??
    metadata.user?.name ??
    metadata.user?.email ??
    (metadata.userId ? `Usuário #${metadata.userId}` : "Sistema")
  );
}

function extractAction(log: TLogItem) {
  return log.message ?? log.name ?? "Evento";
}

function extractModule(log: TLogItem) {
  const metadata = log.metadata ?? {};
  const moduleFromMetadata =
    metadata.module ?? metadata.scope ?? metadata.context ?? metadata.feature ?? metadata.domain;
  if (moduleFromMetadata) return String(moduleFromMetadata);

  const source = `${log.name ?? ""} ${log.message ?? ""}`.toLowerCase();
  if (source.includes("auth") || source.includes("login")) return "Autenticação";
  if (source.includes("cert")) return "Certificados";
  if (source.includes("agenda") || source.includes("visit")) return "Agenda";
  if (source.includes("user")) return "Usuários";
  if (source.includes("comunica")) return "Comunicações";
  if (source.includes("course") || source.includes("aula")) return "Cursos";
  return "Sistema";
}

function extractIp(log: TLogItem) {
  const metadata = log.metadata ?? {};
  return metadata.ip ?? metadata.clientIp ?? metadata.ipAddress ?? metadata.remoteIp ?? "—";
}

function AdminLogsPage() {
  const [logs, setLogs] = useState<TLogItem[]>([]);
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [levelOptions, setLevelOptions] = useState<Array<"info" | "warning" | "error" | "debug">>([
    "info",
    "warning",
    "error",
    "debug",
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [limitFilter, setLimitFilter] = useState(50);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "info" | "warning" | "error" | "debug">("all");
  const [detailsModal, setDetailsModal] = useState<TDetailsModal>({ open: false, log: null });
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const data = await getLogDashboardFilterOptions();
        if (cancelled) return;

        const modulesRaw = (data as any)?.modules ?? (data as any)?.moduleOptions ?? [];
        const levelsRaw = (data as any)?.levels ?? (data as any)?.levelOptions ?? [];

        if (Array.isArray(modulesRaw)) {
          const mappedModules = modulesRaw
            .map(optionToString)
            .filter((value): value is string => Boolean(value))
            .filter((value, index, array) => array.indexOf(value) === index);
          setModuleOptions(mappedModules);
        }

        if (Array.isArray(levelsRaw)) {
          const baseLevels: Array<"info" | "warning" | "error" | "debug"> = ["info", "warning", "error", "debug"];
          setLevelOptions(baseLevels);
        } else {
          setLevelOptions(["info", "warning", "error", "debug"]);
        }
      } catch (e) {
        if (!cancelled) {
          setModuleOptions([]);
          setLevelOptions(["info", "warning", "error", "debug"]);
        }
      }
    }

    loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLogDashboardList({
          from: dateFrom || undefined,
          to: dateTo || undefined,
          module: moduleFilter === "all" ? undefined : moduleFilter,
          level: levelFilter === "all" ? undefined : levelFilter,
          limit: limitFilter,
        });

        if (cancelled) return;
        setLogs(mapLogsPayload(data));
      } catch (e) {
        console.error("Erro ao carregar logs", e);
        if (cancelled) return;
        setLogs([]);
        setError("Não foi possível carregar os logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo, levelFilter, limitFilter, moduleFilter, search]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter(log => {
      const user = extractUser(log);
      const action = extractAction(log);
      const module = extractModule(log);
      const ip = extractIp(log);
      const level = normalizeLevel(log.level);

      if (!term) return true;
      return `${user} ${action} ${module} ${ip} ${level}`.toLowerCase().includes(term);
    });
  }, [logs, search]);

  async function exportCsv() {
    const blob = await exportLogDashboardCsv({
      from: dateFrom || undefined,
      to: dateTo || undefined,
      module: moduleFilter === "all" ? undefined : moduleFilter,
      level: levelFilter === "all" ? undefined : levelFilter,
      limit: limitFilter,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />

      <div className="admin-dashboard-wrapper sap-page admin-logs-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Logs do sistema</b>
            <span>Auditoria de ações realizadas no sistema</span>
          </div>

          <div className="alp-top-actions">
            <button type="button" className="alp-export-btn" onClick={exportCsv}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 4V14M12 14L8 10M12 14L16 10M5 18H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="alp-filters">
          <div className="alp-search-field">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 21L16.65 16.65M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              placeholder="Buscar por usuário, ação ou IP..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <input type="date" className="alp-filter-input date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} />
          <input type="date" className="alp-filter-input date" value={dateTo} onChange={event => setDateTo(event.target.value)} />
          <select className="alp-filter-input" value={String(limitFilter)} onChange={event => setLimitFilter(Number(event.target.value))}>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>

          <select className="alp-filter-input" value={moduleFilter} onChange={event => setModuleFilter(event.target.value)}>
            <option value="all">Todos</option>
            {moduleOptions.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select className="alp-filter-input" value={levelFilter} onChange={event => setLevelFilter(event.target.value as any)}>
            <option value="all">Todos</option>
            {levelOptions.includes("info") && <option value="info">Info</option>}
            {levelOptions.includes("warning") && <option value="warning">Aviso</option>}
            {levelOptions.includes("error") && <option value="error">Erro</option>}
            {levelOptions.includes("debug") && <option value="debug">Debug</option>}
          </select>
        </div>

        <div className="alp-table-card">
          <table className="alp-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>IP</th>
                <th>Level</th>
                <th className="details-col">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="alp-state-row">Carregando logs...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="alp-state-row error">{error}</td>
                </tr>
              )}

              {!loading && !error && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="alp-state-row">Nenhum log encontrado.</td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredLogs.map((log, index) => {
                  const level = normalizeLevel(log.level);
                  const metadataText = JSON.stringify(log.metadata ?? {}, null, 2);

                  return (
                    <tr key={String(log.id ?? `${log.createdAt}-${index}`)}>
                      <td>{formatDateTime(log.createdAt ?? log.updatedAt)}</td>
                      <td>{extractUser(log)}</td>
                      <td>{extractAction(log)}</td>
                      <td>
                        <span className="module-badge">{extractModule(log)}</span>
                      </td>
                      <td className="ip-cell">{extractIp(log)}</td>
                      <td>
                        <span className={`level-badge ${level}`}>{levelLabel(level)}</span>
                      </td>
                      <td className="details-col">
                        <button
                          type="button"
                          className="details-btn"
                          onClick={async () => {
                            const hasId = typeof log.id !== "undefined" && log.id !== null;
                            if (!hasId) {
                              setDetailsModal({ open: true, log });
                              return;
                            }

                            setDetailsLoading(true);
                            try {
                              const entry = await getLogDashboardEntry(log.id as string | number);
                              const parsed =
                                Array.isArray(entry) ? entry[0] : entry?.data ?? entry?.item ?? entry;
                              setDetailsModal({ open: true, log: parsed ?? log });
                            } catch (e) {
                              setDetailsModal({ open: true, log });
                            } finally {
                              setDetailsLoading(false);
                            }
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                          </svg>
                        </button>
                        <span style={{ display: "none" }}>{metadataText}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {detailsModal.open && detailsModal.log && (
          <div className="alp-modal-backdrop" onClick={() => setDetailsModal({ open: false, log: null })}>
            <div className="alp-modal-card" onClick={event => event.stopPropagation()}>
              <div className="alp-modal-header">
                <b>Detalhes do log</b>
                <button type="button" onClick={() => setDetailsModal({ open: false, log: null })}>×</button>
              </div>
              <div className="alp-modal-content">
                {detailsLoading ? (
                  <div className="alp-modal-loading">Carregando detalhes...</div>
                ) : (
                  <>
                    <div className="alp-modal-topline">
                      <span className={`level-badge ${normalizeLevel(detailsModal.log.level)}`}>{levelLabel(detailsModal.log.level)}</span>
                      <span className="alp-modal-date">{formatDateTime(detailsModal.log.createdAt ?? detailsModal.log.updatedAt)}</span>
                    </div>

                    <div className="alp-modal-grid">
                      <div className="alp-modal-field">
                        <span>ID</span>
                        <b>{detailsModal.log.id ?? "—"}</b>
                      </div>
                      <div className="alp-modal-field">
                        <span>Evento</span>
                        <b>{detailsModal.log.name ?? "—"}</b>
                      </div>
                      <div className="alp-modal-field">
                        <span>Usuário</span>
                        <b>{extractUser(detailsModal.log)}</b>
                      </div>
                      <div className="alp-modal-field">
                        <span>Módulo</span>
                        <b>{extractModule(detailsModal.log)}</b>
                      </div>
                      <div className="alp-modal-field">
                        <span>IP</span>
                        <b>{extractIp(detailsModal.log)}</b>
                      </div>
                    </div>

                    <div className="alp-modal-block">
                      <span>Mensagem</span>
                      <p>{detailsModal.log.message ?? "—"}</p>
                    </div>

                    <div className="alp-modal-block">
                      <span>Metadata</span>
                      <pre className="alp-modal-json">{JSON.stringify(detailsModal.log.metadata ?? {}, null, 2)}</pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default AdminLogsPage;
