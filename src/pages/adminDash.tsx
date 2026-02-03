import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import { PieChart, Pie, Cell, Legend } from "recharts";

import Menubar from "../components/admin/menubar";

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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                                  <p className="schedule-title">Orientação Pedagógica</p>
                                  <p className="schedule-user">Ana Paula Mendes</p>
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
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AdminDash