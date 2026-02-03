import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { PieChart, Pie, Cell, Legend } from "recharts";

import Menubar from "../components/admin/menubar";
import Footer from "../components/footer";

import "../style/newAdminDashboard.css";

const studentsEvolution = [
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

const studentsStatusData = [
  { name: "Ativos", value: 2847 },
  { name: "Inativos", value: 197 },
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

function AdminDash() {
    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Dashboard</b>
                            <span>Bem-vindo ao PAX Admin</span>
                        </div>
                        <button>Exportar Relatório</button>
                    </div>
                    <div className="main-cards-wrapper">
                        <div className="card-element">
                            <div className="column">
                                <small>Total de Alunos</small>
                                <b>2.847</b>
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
                                <small>Educadores</small>
                                <b>156</b>
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
                                <b>42</b>
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
                            <span>Evolução de Alunos</span>

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
                            <span>Status de Alunos</span>
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
                                <select className="schedules-filter">
                                  <option value="all">Todos os consultores</option>
                                  <option value="ana-paula-mendes">Ana Paula Mendes</option>
                                  <option value="carlos-eduardo-silva">Carlos Eduardo Silva</option>
                                  <option value="fernanda-costa">Fernanda Costa</option>
                                  <option value="ricardo-almeida">Ricardo Almeida</option>
                                </select>
                                <button className="schedules-link">
                                  Ver agenda completa
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            <div className="schedules-grid">
                              <div className="schedule-item">
                                <div className="schedule-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="7" r="4"></circle>
                                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                                  </svg>
                                </div>
                                <div className="schedule-content">
                                  <b className="schedule-title">Orientação Pedagógica</b>
                                  <span className="schedule-user">Ana Paula Mendes</span>
                                  <div className="schedule-time">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>02/02 às 09:00</span>
                                  </div>
                                </div>
                              </div>

                              <div className="schedule-item">
                                <div className="schedule-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="7" r="4"></circle>
                                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                                  </svg>
                                </div>
                                <div className="schedule-content">
                                  <b className="schedule-title">Orientação Pedagógica</b>
                                  <span className="schedule-user">Ana Paula Mendes</span>
                                  <div className="schedule-time">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>02/02 às 09:00</span>
                                  </div>
                                </div>
                              </div>

                              <div className="schedule-item">
                                <div className="schedule-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="7" r="4"></circle>
                                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                                  </svg>
                                </div>
                                <div className="schedule-content">
                                  <b className="schedule-title">Orientação Pedagógica</b>
                                  <span className="schedule-user">Ana Paula Mendes</span>
                                  <div className="schedule-time">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>02/02 às 09:00</span>
                                  </div>
                                </div>
                              </div>

                              <div className="schedule-item">
                                <div className="schedule-icon">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="7" r="4"></circle>
                                    <path d="M5.5 21a6.5 6.5 0 0 1 13 0"></path>
                                  </svg>
                                </div>
                                <div className="schedule-content">
                                  <b className="schedule-title">Orientação Pedagógica</b>
                                  <span className="schedule-user">Ana Paula Mendes</span>
                                  <div className="schedule-time">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>02/02 às 09:00</span>
                                  </div>
                                </div>
                              </div>
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

                                    <button className="communications-link">
                                    Ver todas
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6"></path>
                                    </svg>
                                    </button>
                                </div>

                                <div className="communications-list">
                                    <div className="communication-item">
                                    <div className="communication-info">
                                        <p className="communication-title">Boas-vindas ao novo semestre</p>
                                        <p className="communication-target">2.847 alunos</p>
                                    </div>

                                    <div className="communication-meta">
                                        <span className="communication-time">Hoje, 10:30</span>
                                        <span className="communication-status status-success">Enviado</span>
                                    </div>
                                    </div>

                                    <div className="communication-item">
                                    <div className="communication-info">
                                        <p className="communication-title">Lembrete: Reunião de pais</p>
                                        <p className="communication-target">1.523 responsáveis</p>
                                    </div>

                                    <div className="communication-meta">
                                        <span className="communication-time">Amanhã, 08:00</span>
                                        <span className="communication-status status-info">Agendado</span>
                                    </div>
                                    </div>

                                    <div className="communication-item">
                                    <div className="communication-info">
                                        <p className="communication-title">Aviso de manutenção</p>
                                        <p className="communication-target">Todos</p>
                                    </div>

                                    <div className="communication-meta">
                                        <span className="communication-time">Ontem, 14:00</span>
                                        <span className="communication-status status-success">Enviado</span>
                                    </div>
                                    </div>

                                    <div className="communication-item">
                                    <div className="communication-info">
                                        <p className="communication-title">Novo curso disponível</p>
                                        <p className="communication-target">A definir</p>
                                    </div>

                                    <div className="communication-meta">
                                        <span className="communication-time">—</span>
                                        <span className="communication-status status-warning">Rascunho</span>
                                    </div>
                                    </div>
                                </div>
                            </div>
                            <div className="activities-card">
                                <div className="activities-header">
                                    <h3 className="activities-title">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M8.93053 16.373C13.0408 16.373 16.3728 13.041 16.3728 8.93077C16.3728 4.82053 13.0408 1.48853 8.93053 1.48853C4.82029 1.48853 1.48828 4.82053 1.48828 8.93077C1.48828 13.041 4.82029 16.373 8.93053 16.373Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M8.92969 4.46533V8.93068L11.9066 10.4191" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Ações Recentes
                                    </h3>

                                    <button className="activities-link">
                                        Ver histórico
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6"></path>
                                        </svg>
                                    </button>
                                </div>

                                <div className="activities-list">
                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M11.9094 15.6287V14.1402C11.9094 13.3507 11.5957 12.5935 11.0375 12.0352C10.4792 11.477 9.722 11.1633 8.93248 11.1633H4.46713C3.67761 11.1633 2.92042 11.477 2.36215 12.0352C1.80387 12.5935 1.49023 13.3507 1.49023 14.1402V15.6287" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M6.69955 8.18646C8.34365 8.18646 9.67645 6.85366 9.67645 5.20956C9.67645 3.56547 8.34365 2.23267 6.69955 2.23267C5.05546 2.23267 3.72266 3.56547 3.72266 5.20956C3.72266 6.85366 5.05546 8.18646 6.69955 8.18646Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M14.1406 5.95374V10.4191" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M16.3716 8.18652H11.9062" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <span className="activity-line" />
                                        </div>

                                        <div className="activity-content">
                                            <p className="activity-title">Novo aluno cadastrado</p>
                                            <div className="activity-meta">
                                            <span>Maria Silva</span>
                                            <span>•</span>
                                            <span>Há 5 min</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M11.163 1.48853H4.46501C4.07025 1.48853 3.69166 1.64534 3.41252 1.92448C3.13338 2.20362 2.97656 2.58221 2.97656 2.97697V14.8846C2.97656 15.2793 3.13338 15.6579 3.41252 15.9371C3.69166 16.2162 4.07025 16.373 4.46501 16.373H13.3957C13.7905 16.373 14.1691 16.2162 14.4482 15.9371C14.7273 15.6579 14.8842 15.2793 14.8842 14.8846V5.20965L11.163 1.48853Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M10.4199 1.48853V4.46542C10.4199 4.86018 10.5767 5.23878 10.8559 5.51792C11.135 5.79705 11.5136 5.95387 11.9084 5.95387H14.8853" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M7.44353 6.698H5.95508" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M11.9089 9.67493H5.95508" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M11.9089 12.6519H5.95508" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <span className="activity-line" />
                                        </div>

                                        <div className="activity-content">
                                            <p className="activity-title">Certificado emitido</p>
                                            <div className="activity-meta">
                                            <span>João Santos</span>
                                            <span>•</span>
                                            <span>Há 15 min</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M9.09554 1.48853H8.76808C8.37332 1.48853 7.99472 1.64534 7.71558 1.92448C7.43645 2.20362 7.27963 2.58221 7.27963 2.97697V3.11093C7.27936 3.37195 7.21046 3.62831 7.07983 3.85429C6.94921 4.08028 6.76145 4.26793 6.5354 4.39844L6.21539 4.5845C5.98911 4.71514 5.73244 4.78391 5.47116 4.78391C5.20989 4.78391 4.95321 4.71514 4.72694 4.5845L4.6153 4.52496C4.27375 4.32794 3.86798 4.27449 3.48706 4.37635C3.10614 4.4782 2.7812 4.72704 2.58357 5.06824L2.41984 5.35105C2.22282 5.6926 2.16937 6.09837 2.27123 6.47929C2.37308 6.86021 2.62193 7.18515 2.96313 7.38278L3.07476 7.45721C3.29972 7.58708 3.48678 7.77357 3.61734 7.99813C3.7479 8.22269 3.81742 8.47752 3.81898 8.73727V9.11683C3.82003 9.37911 3.75174 9.637 3.62105 9.86441C3.49036 10.0918 3.3019 10.2806 3.07476 10.4118L2.96313 10.4788C2.62193 10.6764 2.37308 11.0013 2.27123 11.3822C2.16937 11.7632 2.22282 12.1689 2.41984 12.5105L2.58357 12.7933C2.7812 13.1345 3.10614 13.3833 3.48706 13.4852C3.86798 13.5871 4.27375 13.5336 4.6153 13.3366L4.72694 13.277C4.95321 13.1464 5.20989 13.0776 5.47116 13.0776C5.73244 13.0776 5.98911 13.1464 6.21539 13.277L6.5354 13.4631C6.76145 13.5936 6.94921 13.7813 7.07983 14.0072C7.21046 14.2332 7.27936 14.4896 7.27963 14.7506V14.8846C7.27963 15.2793 7.43645 15.6579 7.71558 15.9371C7.99472 16.2162 8.37332 16.373 8.76808 16.373H9.09554C9.4903 16.373 9.86889 16.2162 10.148 15.9371C10.4272 15.6579 10.584 15.2793 10.584 14.8846V14.7506C10.5843 14.4896 10.6532 14.2332 10.7838 14.0072C10.9144 13.7813 11.1022 13.5936 11.3282 13.4631L11.6482 13.277C11.8745 13.1464 12.1312 13.0776 12.3924 13.0776C12.6537 13.0776 12.9104 13.1464 13.1367 13.277L13.2483 13.3366C13.5899 13.5336 13.9956 13.5871 14.3766 13.4852C14.7575 13.3833 15.0824 13.1345 15.28 12.7933L15.4438 12.503C15.6408 12.1615 15.6942 11.7557 15.5924 11.3748C15.4905 10.9939 15.2417 10.6689 14.9005 10.4713L14.7889 10.4118C14.5617 10.2806 14.3732 10.0918 14.2426 9.86441C14.1119 9.637 14.0436 9.37911 14.0446 9.11683V8.74471C14.0436 8.48243 14.1119 8.22454 14.2426 7.99713C14.3732 7.76973 14.5617 7.5809 14.7889 7.44976L14.9005 7.38278C15.2417 7.18515 15.4905 6.86021 15.5924 6.47929C15.6942 6.09837 15.6408 5.6926 15.4438 5.35105L15.28 5.06824C15.0824 4.72704 14.7575 4.4782 14.3766 4.37635C13.9956 4.27449 13.5899 4.32794 13.2483 4.52496L13.1367 4.5845C12.9104 4.71514 12.6537 4.78391 12.3924 4.78391C12.1312 4.78391 11.8745 4.71514 11.6482 4.5845L11.3282 4.39844C11.1022 4.26793 10.9144 4.08028 10.7838 3.85429C10.6532 3.62831 10.5843 3.37195 10.584 3.11093V2.97697C10.584 2.58221 10.4272 2.20362 10.148 1.92448C9.86889 1.64534 9.4903 1.48853 9.09554 1.48853Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M8.93189 11.1633C10.165 11.1633 11.1646 10.1637 11.1646 8.93067C11.1646 7.6976 10.165 6.698 8.93189 6.698C7.69882 6.698 6.69922 7.6976 6.69922 8.93067C6.69922 10.1637 7.69882 11.1633 8.93189 11.1633Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <span className="activity-line" />
                                        </div>

                                        <div className="activity-content">
                                            <p className="activity-title">Configurações atualizadas</p>
                                            <div className="activity-meta">
                                            <span>Admin</span>
                                            <span>•</span>
                                            <span>Há 1 hora</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M11.9094 15.6287V14.1402C11.9094 13.3507 11.5957 12.5935 11.0375 12.0352C10.4792 11.477 9.722 11.1633 8.93248 11.1633H4.46713C3.67761 11.1633 2.92042 11.477 2.36215 12.0352C1.80387 12.5935 1.49023 13.3507 1.49023 14.1402V15.6287" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M6.69955 8.18646C8.34365 8.18646 9.67645 6.85366 9.67645 5.20956C9.67645 3.56547 8.34365 2.23267 6.69955 2.23267C5.05546 2.23267 3.72266 3.56547 3.72266 5.20956C3.72266 6.85366 5.05546 8.18646 6.69955 8.18646Z" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M14.1406 5.95374V10.4191" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M16.3716 8.18652H11.9062" stroke="#228BC3" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <span className="activity-line" />
                                        </div>

                                        <div className="activity-content">
                                            <p className="activity-title">Novo aluno cadastrado</p>
                                            <div className="activity-meta">
                                            <span>Admin</span>
                                            <span>•</span>
                                            <span>Há 2 horas</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
            <Footer />
        </React.Fragment>
    )
}

export default AdminDash