import { useEffect, useState } from "react";
import { listCommunications } from "../controllers/communication/listCommunications.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import ViewSchedulingForm from "../components/admin/ViewSchedulingForm";
import { listLast30Visits } from "../controllers/admin/listLast30Visits.controller";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { PieChart, Pie, Cell, Legend } from "recharts";
import { getAdminDashboardMetrics } from "../controllers/dash/getAdminDashboardMetrics.controller";
import { getAdminLogsTimeline } from "../controllers/logs/getAdminLogsTimeline.controller";

import Menubar from "../components/admin/menubar";
import Footer from "../components/footer";
import BriefcaseManager from "../components/admin/BriefcaseManager";

import "../style/newAdminDashboard.css";

const DEFAULT_STUDENTS_EVOLUTION = [
    {
        month: "Jan",
        active: 2100,
        inactive: 320
    },
    {
        month: "Fev",
        active: 2200,
        inactive: 280
    },
    {
        month: "Mar",
        active: 2350,
        inactive: 250
    },
    {
        month: "Abr",
        active: 2500,
        inactive: 230
    },
    {
        month: "Mai",
        active: 2650,
        inactive: 210
    },
    {
        month: "Jun",
        active: 2847,
        inactive: 197
    }
]

const DEFAULT_STUDENTS_STATUS_DATA = [
  { name: "Ativos", value: 0 },
  { name: "Inativos", value: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const activeValue = payload.find((p: any) => p.dataKey === "active")?.value;
  const inactiveValue = payload.find((p: any) => p.dataKey === "inactive")?.value;

  return (
    <div className="custom-tooltip">
      <span className="tooltip-title">{label}</span>

      <div className="tooltip-row active">
        <span>Ativos:</span>
        <strong>{activeValue}</strong>
      </div>

      <div className="tooltip-row inactive">
        <span>Inativos:</span>
        <strong>{inactiveValue}</strong>
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const { name, value, fill } = payload[0];

  return (
    <div className="custom-tooltip">
      <span className="tooltip-title">{name}</span>
      <div className="tooltip-row active">
        <span>Total:</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
};

type TConsultant = {
    id: number;
    firstName: string;
    lastName: string;
}

function safeNumber(value: any, fallback: number) {
  const n = typeof value === "string" ? Number(value.replace(/\./g, "").replace(/,/g, ".")) : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function monthLabelFromYYYYMM(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value

  const year = match[1]
  const month = Number(match[2])
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const monthName = monthNames[month - 1]
  if (!monthName) return value

  return `${monthName}/${year.slice(2)}`
}

function parseLocalSqlDateTime(value?: string | null) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!match) return null;

  const [, y, m, d, hh, mm, ss] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss || 0)
  );
}

function timeAgo(dateInput?: string | number | Date | null) {
  if (!dateInput) return "—";

  const toDate = (value: string | number | Date) => {
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);

    const s = value.trim();
    if (!s) return new Date(NaN);

    // Se vier com timezone (Z ou offset), respeita.
    const hasTimezone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
    if (hasTimezone) return new Date(s);

    // Se vier sem timezone (ex: "2026-02-10T15:07:27.000"), assume horário local do browser.
    const isIsoWithoutTz = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s);
    if (isIsoWithoutTz) return new Date(s);

    // Se vier "YYYY-MM-DD HH:mm:ss", converte para ISO local (sem timezone)
    const matchSql = /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})(\.\d+)?$/.exec(s);
    if (matchSql) return new Date(`${matchSql[1]}T${matchSql[2]}${matchSql[3] ?? ""}`);

    return new Date(s);
  };

  const date = toDate(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 10) return "Agora";
  if (diffSec < 60) return `Há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Há ${diffD} dias`;
  return date.toLocaleDateString("pt-BR");
}

type TLogTimelineItem = {
  id?: number | string;
  level?: string;
  name?: string;
  message?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;

  // compat com formatos antigos
  title?: string;
  event?: string;
  timestamp?: string;
  user?: { name?: string; email?: string };
  actor?: string;
  source?: string;
};

function AdminDash() {
    const [lastVisits, setLastVisits] = useState<any[]>([]);
    const [studentsTotal, setStudentsTotal] = useState(2847);
    const [educatorsTotal, setEducatorsTotal] = useState(156);
    const [activeCoursesTotal, setActiveCoursesTotal] = useState(42);
    const [studentsEvolution, setStudentsEvolution] = useState(DEFAULT_STUDENTS_EVOLUTION);
    const [studentsStatusData, setStudentsStatusData] = useState(DEFAULT_STUDENTS_STATUS_DATA);
    // === ViewSchedulingForm state ===
    const [viewSchedulingFormOpen, setViewSchedulingFormOpen] = useState(false);
    const [openedVisitId, setOpenedVisitId] = useState<number>(0);
    // ===== Consultor selector states (igual agendaAdminPage) =====
    const [consultants, setConsultants] = useState<any[]>([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState<number | undefined>(undefined);
    // === Refresh control state ===
    const [refreshKey, setRefreshKey] = useState(0);
    const [communications, setCommunications] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsTimeline, setLogsTimeline] = useState<TLogTimelineItem[]>([]);

    // Função para abrir o modal de visualização de agendamento
    function openViewScheduling(visitId: number) {
      setOpenedVisitId(visitId);
      setViewSchedulingFormOpen(true);
    }

    // === Buscar consultores (igual agendaAdminPage) ===
    useEffect(() => {
      async function loadConsultants() {
        try {
          const data = await listConsultants();
          setConsultants(data);
        } catch (err) {
          console.error("Erro ao carregar consultores", err);
        }
      }
      loadConsultants();
    }, []);

    // === Buscar agendas respeitando consultor (igual agendaAdminPage) ===
    useEffect(() => {
      async function loadLastVisits() {
        try {
          const data = await listLast30Visits(selectedConsultantId);
          setLastVisits(data);
        } catch (err) {
          console.error("Erro ao carregar últimas agendas", err);
        }
      }
      loadLastVisits();
    }, [selectedConsultantId, refreshKey]);

    useEffect(() => {
      async function loadCommunications() {
        try {
          const response = await listCommunications({ page: 1 });

          const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.items)
                ? response.items
                : [];

          setCommunications(list.slice(0, 4));
        } catch (err) {
          console.error("Erro ao carregar comunicações", err);
        }
      }

      loadCommunications();
    }, []);

    useEffect(() => {
      async function loadDashboardMetrics() {
        try {
          const raw = await getAdminDashboardMetrics();
          const data = raw?.data ?? raw

          setStudentsTotal(safeNumber(data?.users?.studentsTotal, studentsTotal))
          setEducatorsTotal(safeNumber(data?.users?.educatorsTotal, educatorsTotal))
          setActiveCoursesTotal(safeNumber(data?.activeCourses, activeCoursesTotal))

          if (Array.isArray(data?.studentsEvolution)) {
            setStudentsEvolution(
              data.studentsEvolution.map((item: any) => ({
                month: monthLabelFromYYYYMM(String(item.month ?? "")),
                active: safeNumber(item.active, 0),
                inactive: safeNumber(item.inactive, 0) + safeNumber(item.blocked, 0),
              }))
            )
          }

          if (data?.studentsStatus) {
            const active = safeNumber(data.studentsStatus.active, DEFAULT_STUDENTS_STATUS_DATA[0].value)
            const inactive = safeNumber(data.studentsStatus.inactive, 0) + safeNumber(data.studentsStatus.blocked, 0)
            setStudentsStatusData([
              { name: "Ativos", value: active },
              { name: "Inativos", value: inactive },
            ])
          }
        } catch (err) {
          console.error("Erro ao carregar métricas do dashboard", err);
        }
      }

      loadDashboardMetrics();
    }, []);

    useEffect(() => {
      async function loadLogsTimeline() {
        setLogsLoading(true);
        try {
          const data = await getAdminLogsTimeline({ limit: 6 });

          const list: TLogTimelineItem[] = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : Array.isArray((data as any)?.timeline)
                ? (data as any).timeline
                : Array.isArray((data as any)?.data)
                  ? (data as any).data
                  : [];

          setLogsTimeline(list);
        } catch (err) {
          console.error("Erro ao carregar logs do dashboard", err);
          setLogsTimeline([]);
        } finally {
          setLogsLoading(false);
        }
      }

      loadLogsTimeline();
    }, []);

    // === Função do seletor de consultor (igual agendaAdminPage) ===
    function handleSelectConsultant(
      event: React.ChangeEvent<HTMLSelectElement>
    ) {
      const consultantId = Number(event.currentTarget.value || undefined);
      setSelectedConsultantId(consultantId);
    }

    // Communication status class map for status badge
    const communicationStatusClass: Record<string, string> = {
      sent: 'status-success',
      scheduled: 'status-info',
      draft: 'status-warning',
      processing: 'status-info',
      failed: 'status-danger'
    };
    const communicationStatusLabel: Record<string, string> = {
      sent: 'Enviada',
      scheduled: 'Agendada',
      draft: 'Rascunho',
      processing: 'Enviando',
      failed: 'Falhou'
    };

    function htmlToPlainText(html?: string) {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    return (
        <div>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Dashboard</b>
                            <span>Bem-vindo ao PAX Admin</span>
                        </div>
                    </div>
                    <div className="main-cards-wrapper">
                        <div className="card-element">
                            <div className="column">
                                <small>Total de Educadores</small>
                                <b>{studentsTotal.toLocaleString("pt-BR")}</b>
                                <div className="line">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M16.3747 5.20972L10.0488 11.5356L6.32769 7.8145L1.49023 12.652" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M11.9062 5.20972H16.3716V9.67506" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span className="percentage">+12%</span>
                                    <span>vs mês anterior</span>
                                </div>
                            </div>
                            <div className="image-wrapper alunos">
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                                    <path d="M17.8611 23.4431V21.2105C17.8611 20.0262 17.3907 18.8904 16.5533 18.053C15.7158 17.2156 14.5801 16.7451 13.3958 16.7451H6.69777C5.51348 16.7451 4.37771 17.2156 3.54029 18.053C2.70288 18.8904 2.23242 20.0262 2.23242 21.2105V23.4431" stroke="#228BC3" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M10.0454 12.2798C12.5116 12.2798 14.5108 10.2806 14.5108 7.81447C14.5108 5.34832 12.5116 3.34912 10.0454 3.34912C7.57928 3.34912 5.58008 5.34832 5.58008 7.81447C5.58008 10.2806 7.57928 12.2798 10.0454 12.2798Z" stroke="#228BC3" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.558 23.443V21.2104C24.5573 20.221 24.228 19.2599 23.6218 18.4779C23.0156 17.696 22.1669 17.1375 21.209 16.8901" stroke="#228BC3" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M17.8613 3.4939C18.8218 3.73983 19.6732 4.29844 20.2811 5.08167C20.8891 5.86491 21.2191 6.8282 21.2191 7.8197C21.2191 8.8112 20.8891 9.7745 20.2811 10.5577C19.6732 11.341 18.8218 11.8996 17.8613 12.1455" stroke="#228BC3" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        <div className="card-element">
                            <div className="column">
                                <small>Coordenadores</small>
                                <b>{educatorsTotal.toLocaleString("pt-BR")}</b>
                                <div className="line">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M16.3747 5.20972L10.0488 11.5356L6.32769 7.8145L1.49023 12.652" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M11.9062 5.20972H16.3716V9.67506" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span className="percentage">+3%</span>
                                    <span>vs mês anterior</span>
                                </div>
                            </div>
                            <div className="image-wrapper educadores">
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                                    <path d="M23.9123 12.1929C24.1122 12.1047 24.2818 11.9599 24.4001 11.7763C24.5184 11.5927 24.5803 11.3784 24.578 11.16C24.5758 10.9416 24.5095 10.7286 24.3874 10.5475C24.2653 10.3664 24.0927 10.2251 23.8911 10.1411L14.323 5.78288C14.0321 5.6502 13.7161 5.58154 13.3964 5.58154C13.0767 5.58154 12.7607 5.6502 12.4699 5.78288L2.90286 10.1366C2.70412 10.2236 2.53505 10.3667 2.41632 10.5483C2.2976 10.7299 2.23438 10.9422 2.23438 11.1592C2.23438 11.3761 2.2976 11.5884 2.41632 11.77C2.53505 11.9516 2.70412 12.0947 2.90286 12.1817L12.4699 16.5444C12.7607 16.677 13.0767 16.7457 13.3964 16.7457C13.7161 16.7457 14.0321 16.677 14.323 16.5444L23.9123 12.1929Z" stroke="#10B77F" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M24.5586 11.1633V17.8614" stroke="#10B77F" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M6.69727 13.9541V17.8613C6.69727 18.7495 7.40295 19.6013 8.65907 20.2294C9.91519 20.8574 11.6189 21.2103 13.3953 21.2103C15.1717 21.2103 16.8754 20.8574 18.1315 20.2294C19.3876 19.6013 20.0933 18.7495 20.0933 17.8613V13.9541" stroke="#10B77F" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        <div className="card-element">
                            <div className="column">
                                <small>Cursos Ativos</small>
                                <b>{activeCoursesTotal.toLocaleString("pt-BR")}</b>
                                <div className="line">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M16.3747 5.20972L10.0488 11.5356L6.32769 7.8145L1.49023 12.652" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M11.9062 5.20972H16.3716V9.67506" stroke="#10B77F" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span className="percentage">+5%</span>
                                    <span>vs mês anterior</span>
                                </div>
                            </div>
                            <div className="image-wrapper cursos">
                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 27 27" fill="none">
                                    <path d="M13.3945 7.81445V23.4432" stroke="#F59F0A" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3.34876 20.0942C3.05269 20.0942 2.76874 19.9766 2.55939 19.7672C2.35004 19.5578 2.23242 19.2739 2.23242 18.9778V4.46546C2.23242 4.16939 2.35004 3.88544 2.55939 3.67609C2.76874 3.46673 3.05269 3.34912 3.34876 3.34912H8.93044C10.1147 3.34912 11.2505 3.81958 12.0879 4.65699C12.9253 5.49441 13.3958 6.63018 13.3958 7.81447C13.3958 6.63018 13.8662 5.49441 14.7037 4.65699C15.5411 3.81958 16.6769 3.34912 17.8611 3.34912H23.4428C23.7389 3.34912 24.0228 3.46673 24.2322 3.67609C24.4415 3.88544 24.5592 4.16939 24.5592 4.46546V18.9778C24.5592 19.2739 24.4415 19.5578 24.2322 19.7672C24.0228 19.9766 23.7389 20.0942 23.4428 20.0942H16.7448C15.8566 20.0942 15.0048 20.447 14.3767 21.0751C13.7486 21.7031 13.3958 22.555 13.3958 23.4432C13.3958 22.555 13.0429 21.7031 12.4149 21.0751C11.7868 20.447 10.935 20.0942 10.0468 20.0942H3.34876Z" stroke="#F59F0A" stroke-width="2.23267" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </div>

                        <div className="evolution-wrapper">
                            <span>Evolução de Educadores</span>

                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={studentsEvolution} barGap={6}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="active" fill="#228BC3" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="inactive" fill="#D1D5DB" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="status-pie-wrapper">
                            <span>Status de Educadores</span>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                <Pie data={studentsStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                                    <Cell key="active" fill="#228BC3" />
                                    <Cell key="inactive" fill="#D1D5DB" />
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="status-pie-legend">
                              <div className="legend-item">
                                <span className="legend-color active"></span>
                                <span>Ativos</span>
                              </div>
                              <div className="legend-item">
                                <span className="legend-color inactive"></span>
                                <span>Inativos</span>
                              </div>
                            </div>
                        </div>

                        <BriefcaseManager />

                        <div className="schedules-wrapper">
                          <div className="schedules-card">
                            <div className="schedules-header">
                              <h3 className="schedules-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <path d="M5.95312 1.48865V4.46555" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M11.9082 1.48865V4.46555" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14.14 2.97693H3.72087C2.89882 2.97693 2.23242 3.64333 2.23242 4.46538V14.8845C2.23242 15.7066 2.89882 16.373 3.72087 16.373H14.14C14.9621 16.373 15.6285 15.7066 15.6285 14.8845V4.46538C15.6285 3.64333 14.9621 2.97693 14.14 2.97693Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2.23242 7.44238H15.6285" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Consultores & Próximas Agendas
                              </h3>

                              <div className="schedules-actions">
                                <select
                                  className="schedules-filter"
                                  value={selectedConsultantId ?? ""}
                                  onChange={handleSelectConsultant}
                                >
                                  <option value="">Todos os consultores</option>
                                  {consultants.map((consultant) => (
                                    <option key={consultant.id} value={consultant.id}>
                                      {consultant.firstName
                                        ? `${consultant.firstName} ${consultant.lastName}`
                                        : consultant.name}
                                    </option>
                                  ))}
                                </select>
                                <button className="schedules-link" onClick={() => window.location.href = "/admin/agenda"}>
                                  Ver agenda completa
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <div className="schedules-grid">
                              {lastVisits.slice(0, 4).map(visit => (
                                <div
                                  className="schedule-item"
                                  key={visit.id}
                                  onClick={() => openViewScheduling(visit.id)}
                                >
                                  <div className="schedule-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="7" r="4"></circle>
                                      <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                                    </svg>
                                  </div>
                                  <div className="schedule-content">
                                    <b className="schedule-title">{visit.visit_type}</b>
                                    <span className="schedule-user">{visit.college_name}</span>
                                    <span className="schedule-user">{
                                        (() => {
                                            const consultant = consultants.find(c => c.id === visit.creator_id);
                                            return consultant
                                              ? (consultant.firstName
                                                  ? `${consultant.firstName} ${consultant.lastName}`
                                                  : consultant.name)
                                              : "Consultor desconhecido";
                                        })()
                                    }</span>
                                    <div className="schedule-time">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      <span>
                                        {
                                            (() => {
                                                const [year, month, day] = visit.visit_date.split('-').map(Number);
                                                const date = new Date(year, month - 1, day);
                                                const time = parseLocalSqlDateTime(visit.init_visit_time)
                                                const formattedDate = date.toLocaleDateString('pt-BR');
                                                const formattedTime = time
                                                  ? time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                                  : "--:--";
                                                return `${formattedDate} às ${formattedTime}`;
                                            })()
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="splitted-container">
                            <div className="communications-card">
                                <div className="communications-header">
                                    <h3 className="communications-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M15.6285 11.1634C15.6285 11.5581 15.4716 11.9367 15.1925 12.2159C14.9134 12.495 14.5348 12.6518 14.14 12.6518H5.20932L2.23242 15.6287V3.72111C2.23242 3.32635 2.38924 2.94776 2.66838 2.66862C2.94752 2.38948 3.32611 2.23267 3.72087 2.23267H14.14C14.5348 2.23267 14.9134 2.38948 15.1925 2.66862C15.4716 2.94776 15.6285 3.32635 15.6285 3.72111V11.1634Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Comunicações Recentes
                                    </h3>

                                    <a className="communications-link" href="/admin/communications">
                                    Ver todas
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6"></path>
                                    </svg>
                                    </a>
                                </div>

                            <div className="communications-list">
                                {communications.map(comm => (
                                  <div className="communication-item" key={comm.id}>
                                    <div className="communication-info">
                                      <p className="communication-title">{comm.title}</p>
                                      <p className="communication-target">
                                        {htmlToPlainText(comm.message)}
                                      </p>
                                    </div>

                                    <div className="communication-meta">
                                      <span className="communication-time">
                                        {comm.sentAt
                                          ? new Date(comm.sentAt).toLocaleString('pt-BR', {
                                              dateStyle: 'short',
                                              timeStyle: 'short'
                                            })
                                          : '—'}
                                      </span>
                                      <span className={`communication-status ${communicationStatusClass[comm.status] ?? ''}`}>
                                        {communicationStatusLabel[comm.status] ?? comm.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                            </div>
                            <div className="activities-card">
                                <div className="activities-header">
                                    <h3 className="activities-title">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M8.93053 16.373C13.0408 16.373 16.3728 13.041 16.3728 8.93077C16.3728 4.82053 13.0408 1.48853 8.93053 1.48853C4.82029 1.48853 1.48828 4.82053 1.48828 8.93077C1.48828 13.041 4.82029 16.373 8.93053 16.373Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8.92969 4.46533V8.93068L11.9066 10.4191" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Logs Recentes
                                    </h3>

                                    <a href="/admin/logs" className="activities-link">
                                        Ver histórico
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6"></path>
                                        </svg>
                                    </a>
                                </div>

                                <div className="activities-list">
                  {logsLoading ? (
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#6B7280" }}>Carregando...</div>
                  ) : logsTimeline.length === 0 ? (
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#6B7280" }}>Sem logs recentes.</div>
                  ) : (
	                    logsTimeline.map((item, index) => {
	                      const level = String(item.level ?? "").toLowerCase();
	                      const title =
	                        item.message ??
	                        item.title ??
	                        item.event ??
	                        (item.name ? `${item.name}` : level ? `Evento (${level})` : "Evento");
	                      const who =
	                        item.user?.name ??
	                        item.actor ??
	                        item.source ??
	                        (item.metadata?.userId ? `Usuário #${item.metadata.userId}` : item.name ?? "Sistema");
	                      const when = timeAgo(item.createdAt ?? item.timestamp);

                      const iconClass =
                        level === "error" || level === "fatal"
                          ? "level-error"
                          : level === "warn" || level === "warning"
                            ? "level-warn"
                            : "level-info";

                      return (
                        <div className="activity-item" key={String(item.id ?? `${title}-${index}`)}>
                          <div className={`activity-icon ${iconClass}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path
                                d="M8.93053 16.373C13.0408 16.373 16.3728 13.041 16.3728 8.93077C16.3728 4.82053 13.0408 1.48853 8.93053 1.48853C4.82029 1.48853 1.48828 4.82053 1.48828 8.93077C1.48828 13.041 4.82029 16.373 8.93053 16.373Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8.92969 4.46533V8.93068L11.9066 10.4191"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {index < logsTimeline.length - 1 && <span className="activity-line" />}
                          </div>

                          <div className="activity-content">
                            <p className="activity-title">{title}</p>
                            <div className="activity-meta">
                              <span>{who}</span>
                              <span>•</span>
                              <span>{when}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
            <ViewSchedulingForm
              opened={viewSchedulingFormOpen}
              onClose={() => {
                setViewSchedulingFormOpen(false);
                setRefreshKey(prev => prev + 1);
              }}
              visitId={openedVisitId}
              onCancelled={() => setRefreshKey(prev => prev + 1)}
              onRescheduled={() => setRefreshKey(prev => prev + 1)}
            />
            <Footer />
        </div>
    )
}

export default AdminDash
