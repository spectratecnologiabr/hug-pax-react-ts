import React, { useState } from "react";

import Menubar from "../components/admin/menubar";
import NewSchedulingForm from "../components/admin/NewSchedulingForm";
import AdminDatePicker from "../components/admin/AdminDatePicker";

import "../style/agendaAdminPage.css"

function AgendaAdminPage() {
    const [ newSchedFormOpen, setNewSchedFormOpen ] = useState(false);
    const [ tabOpen, setTabOpen ] = useState<"list" | "calendar">("list")

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Agenda de Consultores</b>
                            <span>Gerencie e visualize os agendamentos</span>
                        </div>
                        <button onClick={() => setNewSchedFormOpen(true)}>+ Novo Agendamento</button>
                    </div>
                    <div className="agenda-filters-card">
                      <div className="agenda-filters-wrapper">
                        <div className="agenda-filter-select">
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15" fill="none">
                                <path d="M15.6286 0.744141H0.744141L6.69794 7.7845V12.6517L9.67483 14.1402V7.7845L15.6286 0.744141Z" stroke="#737B8C" stroke-width="1.48845" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>

                            <select className="agenda-consultant-select">
                                <option value="all">Todos os Consultores</option>
                                <option value="ana">Ana Paula</option>
                                <option value="carlos">Carlos Eduardo</option>
                                <option value="fernanda">Fernanda Costa</option>
                            </select>
                        </div>

                        <div className="agenda-quick-filters">
                            <button className="agenda-filter-btn">Hoje</button>
                            <button className="agenda-filter-btn">Esta Semana</button>
                            <button className="agenda-filter-btn">Este Mês</button>
                            <button className="agenda-filter-btn is-active">Todos</button>
                        </div>
                      </div>
                    </div>
                    
                        <div className="agenda-listing-container">
                            <div className="agenda-view-tabs">
                                <button className={(tabOpen === "list") ? "agenda-tab is-active" : "agenda-tab"} onClick={() => setTabOpen("list")}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 8H2.00667" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 12H2.00667" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 4H2.00667" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M5.33398 8H14.0007" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M5.33398 12H14.0007" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M5.33398 4H14.0007" stroke="#29303D" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>

                                    Lista
                                </button>

                                <button className={(tabOpen === "calendar") ? "agenda-tab is-active" : "agenda-tab"} onClick={() => setTabOpen("calendar")}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.33398 1.33325V3.99992" stroke="#737B8C" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M10.666 1.33325V3.99992" stroke="#737B8C" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M12.6667 2.66675H3.33333C2.59695 2.66675 2 3.2637 2 4.00008V13.3334C2 14.0698 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0698 14 13.3334V4.00008C14 3.2637 13.403 2.66675 12.6667 2.66675Z" stroke="#737B8C" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 6.66675H14" stroke="#737B8C" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>

                                    Calendário
                                </button>
                            </div>

                        { (tabOpen === "list") ?
                            <div className="agenda-list-panel">
                                <div className="agenda-list-card">
                                    <div className="agenda-list-header">
                                    <h3>7 agendamentos encontrados</h3>
                                    </div>

                                    <div className="agenda-list">
                                    <div className="agenda-item">
                                        <div className="agenda-item-main">
                                        <div className="agenda-item-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
                                                <path d="M17.6546 19.5122V17.6539C17.6546 16.6682 17.2631 15.7228 16.5661 15.0258C15.8691 14.3288 14.9237 13.9373 13.938 13.9373H8.3631C7.37739 13.9373 6.43205 14.3288 5.73505 15.0258C5.03805 15.7228 4.64648 16.6682 4.64648 17.6539V19.5122" stroke="#228BC3" stroke-width="1.85831" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M11.1502 10.2206C13.2028 10.2206 14.8668 8.5566 14.8668 6.50397C14.8668 4.45134 13.2028 2.78735 11.1502 2.78735C9.09758 2.78735 7.43359 4.45134 7.43359 6.50397C7.43359 8.5566 9.09758 10.2206 11.1502 10.2206Z" stroke="#228BC3" stroke-width="1.85831" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>

                                        <div className="agenda-item-info">
                                            <p className="agenda-item-title">Orientação Pedagógica</p>
                                            <p className="agenda-item-sub">Ana Paula Mendes</p>
                                            <p className="agenda-item-sub">Escola Municipal São José</p>
                                        </div>
                                        </div>

                                        <div className="agenda-item-meta">
                                        <div className="agenda-item-date">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <path d="M8.9137 16.353C13.019 16.353 16.3469 13.0251 16.3469 8.9198C16.3469 4.81454 13.019 1.48657 8.9137 1.48657C4.80844 1.48657 1.48047 4.81454 1.48047 8.9198C1.48047 13.0251 4.80844 16.353 8.9137 16.353Z" stroke="#737B8C" stroke-width="1.48665" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M8.91797 4.45996V8.9199L11.8913 10.4065" stroke="#737B8C" stroke-width="1.48665" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            <span>02/02/2026 às 09:00</span>
                                        </div>

                                        <div className="agenda-item-extra">
                                            <span>Duração: 1h</span>
                                            <span className="agenda-badge is-presencial">Presencial</span>
                                        </div>
                                        </div>
                                    </div>

                                    {/* Repete agenda-item */}
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="agenda-calendar-panel">
                                <div className="agenda-calendar-grid">
                                {/* CALENDÁRIO MENSAL */}

                                <div className="agenda-calendar-card agenda-calendar-month">
                                    <AdminDatePicker selectedDate={new Date()} onChange={() => {}} />
                                </div>

                                {/* VISÃO SEMANAL */}
                                <div className="agenda-calendar-card agenda-calendar-week">
                                    <div className="agenda-calendar-header is-inline">
                                    <h3>Visão Semanal</h3>

                                    <div className="agenda-week-nav">
                                        <button>‹</button>
                                        <span>02 fev - 08 fev 2026</span>
                                        <button>›</button>
                                    </div>
                                    </div>

                                    <div className="agenda-week-grid">

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>segunda</span>
                                        <strong>02</strong>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day is-today">
                                        <div className="agenda-week-day-header">
                                        <span>terça</span>
                                        <strong>03</strong>
                                        </div>

                                        <div
                                        className="agenda-week-event"
                                        title="Workshop de Metodologias - Fernanda Costa"
                                        >
                                        <strong>10:00</strong>
                                        <span>Workshop de Metodologias</span>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>quarta</span>
                                        <strong>04</strong>
                                        </div>

                                        <div
                                        className="agenda-week-event"
                                        title="Acompanhamento Mensal - Ana Paula Mendes"
                                        >
                                        <strong>08:30</strong>
                                        <span>Acompanhamento Mensal</span>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>quinta</span>
                                        <strong>05</strong>
                                        </div>

                                        <div
                                        className="agenda-week-event"
                                        title="Consultoria Administrativa - Ricardo Almeida"
                                        >
                                        <strong>11:00</strong>
                                        <span>Consultoria Administrativa</span>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>sexta</span>
                                        <strong>06</strong>
                                        </div>

                                        <div
                                        className="agenda-week-event"
                                        title="Avaliação de Resultados - Juliana Santos"
                                        >
                                        <strong>15:00</strong>
                                        <span>Avaliação de Resultados</span>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>sábado</span>
                                        <strong>07</strong>
                                        </div>

                                        <div
                                        className="agenda-week-event"
                                        title="Treinamento de Equipe - Carlos Eduardo Silva"
                                        >
                                        <strong>09:30</strong>
                                        <span>Treinamento de Equipe</span>
                                        </div>
                                    </div>

                                    <div className="agenda-week-day">
                                        <div className="agenda-week-day-header">
                                        <span>domingo</span>
                                        <strong>08</strong>
                                        </div>
                                    </div>

                                    </div>
                                </div>

                                </div>
                            </div>
                            } 
                        </div>  
                </div>
            </div>
            <NewSchedulingForm opened={newSchedFormOpen} onClose={() => setNewSchedFormOpen(false)} />
        </React.Fragment>
    )
}

export default AgendaAdminPage