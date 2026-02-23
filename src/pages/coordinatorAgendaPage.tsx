import React, { useState, useEffect } from "react";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listLast30Visits } from "../controllers/admin/listLast30Visits.controller";
import { listVistsToday } from "../controllers/admin/listVisitsToday.controller";
import { listVistsThisWeek } from "../controllers/admin/listVisitsThisWeek.controller";
import { listVistsThisMonth } from "../controllers/admin/listVisitsThisMonth.controller";
import { listVisitsByWeekRange } from "../controllers/admin/listVisitsByWeekRange.controller";

import Menubar from "../components/coordinator/menubar";
import NewSchedulingForm from "../components/admin/NewSchedulingForm";
import AdminDatePicker from "../components/admin/AdminDatePicker";
import ViewSchedulingForm from "../components/admin/ViewSchedulingForm";
import { formatDateInAppTimeZone } from "../utils/timezone";

import "../style/agendaAdminPage.css"

type TVisit = {
    id: number,
    college_id: number,
    creator_id: number,
    institution_profile: string,
    visit_type: string,
    college_name: string,
    college_address: string,
    college_number: number,
    city: string,
    manager: string,
    visit_date: string,
    lastVisit_date: string,
    last_rescheduling_reason: string,
    rescheduling_amount: string,
    cancel_reason: string,
    guest_consultants: any[],
    init_route_time: string,
    init_route_coordinates: string,
    end_route_time: string,
    end_route_coordinates: string,
    init_visit_time: string,
    end_visit_time: string,
    visit_observations: string,
    scheduling_observations: string,
    form_answers: any[],
    photos: any[],
    status: string,
    created_at: string,
    updated_at: string
}

type TConsultant = {
    id: number;
    firstName: string;
    lastName: string;
}

// ===== Helpers for week range and grouping visits =====
function getWeekRange(date: Date) {
  const base = new Date(date);
  const day = base.getDay(); // 0 = domingo
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(base);
  start.setDate(base.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function groupVisitsByDay(visits: TVisit[]) {
  return visits.reduce<Record<string, TVisit[]>>((acc, visit) => {
    const match = String(visit.visit_date || "").match(/^(\d{4}-\d{2}-\d{2})/);
    const key = match ? match[1] : String(visit.visit_date || "");
    acc[key] = acc[key] || [];
    acc[key].push(visit);
    return acc;
  }, {});
}


const parsedStatus: Record<string, string> = {
  scheduled: "Agendado",
  cancelled: "Cancelado",
  completed: "Concluído",
  rescheduled: "Reagendado",
}

function formatWeekRange(range: { start: Date; end: Date }) {
  const start = range.start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  const end = range.end.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${start} - ${end}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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

function CoordinatorAgendaPage() {
    const [ newSchedFormOpen, setNewSchedFormOpen ] = useState(false)
    const [ tabOpen, setTabOpen ] = useState<"list" | "calendar">("list")
    const [ consultants, setConsultants ] = useState<TConsultant[]>([])
    const [ selectedConsultantId, setSelectedConsultantId ] = useState<number | undefined>(undefined);
    const [ presetFilter, setPresetFilter ] = useState<"all" | "today" | "week" | "month">("all")
    const [ visits, setVisits ] = useState<TVisit[]>([])
    const [ selectedDate, setSelectedDate ] = useState(new Date());

    // === ViewSchedulingForm state ===
    const [viewSchedulingFormOpen, setViewSchedulingFormOpen] = useState(false);
    const [openedVisitId, setOpenedVisitId] = useState<number>(0);
    // === Refresh control state ===
    const [refreshKey, setRefreshKey] = useState(0);

    // === Semanal view state ===
    const [weekVisits, setWeekVisits] = useState<Record<string, TVisit[]>>({});
    const [weekRange, setWeekRange] = useState<{ start: Date; end: Date }>(() =>
      getWeekRange(new Date())
    );
    // Função para abrir o modal de visualização de agendamento
    function openViewScheduling(visitId: number) {
      setOpenedVisitId(visitId);
      setViewSchedulingFormOpen(true);
    }

    useEffect(() => {
        async function fetchConsultants() {
            try {
                const consultantsData = await listConsultants();
                setConsultants(consultantsData);
            } catch (error) {
                console.error("Error fetching consultants:", error);
            }
        }
        fetchConsultants()
    }, [selectedConsultantId])

    useEffect(() => {
      async function loadVisits() {
        try {
          const data = await fetchVisitsByPreset(presetFilter, selectedConsultantId);
          setVisits(data);
        } catch (error) {
          console.error("Erro ao buscar visitas:", error);
        }
      }
      loadVisits();
    }, [presetFilter, selectedConsultantId, refreshKey]);

    function handleSelectConsultant(event: React.ChangeEvent<HTMLSelectElement>) {
        const consultantId = Number(event.currentTarget.value || undefined);
        setSelectedConsultantId(consultantId);
    }

    function handleSelectPresetFilter(event: React.MouseEvent<HTMLButtonElement>) {
        const filter = event.currentTarget.dataset.filter as
            | "all"
            | "today"
            | "week"
            | "month"
            | undefined;

        const resolvedFilter = filter ?? "all";
        setPresetFilter(resolvedFilter);
    }

    function handleDateChange(date: Date | null) {
        const resolvedDate = date || new Date();
        setSelectedDate(resolvedDate);
        setWeekRange(getWeekRange(resolvedDate));
    }

    // === Load week visits when selectedDate, selectedConsultantId, tabOpen, or refreshKey changes ===
    useEffect(() => {
      async function fetchWeekVisits() {
        try {
          const dateBase = formatDateInAppTimeZone(selectedDate);

          const data = await listVisitsByWeekRange(
            dateBase,
            selectedConsultantId
          );

          const range = getWeekRange(selectedDate);
          setWeekRange(range);

          setWeekVisits(groupVisitsByDay(data));
        } catch (error) {
          console.error("Erro ao buscar visitas da semana:", error);
        }
      }

      if (tabOpen === "calendar") {
        fetchWeekVisits();
      }
    }, [selectedDate, selectedConsultantId, tabOpen, refreshKey]);

    function handlePrevWeek() {
      const newDate = addDays(selectedDate, -7);
      setSelectedDate(newDate);
      setWeekRange(getWeekRange(newDate));
    }

    function handleNextWeek() {
      const newDate = addDays(selectedDate, 7);
      setSelectedDate(newDate);
      setWeekRange(getWeekRange(newDate));
    }

    // ===== Helper to fetch visits by preset =====
    async function fetchVisitsByPreset(preset: "all" | "today" | "week" | "month", consultantId?: number) {
        if (preset === "today") {
            return listVistsToday(consultantId);
        }

        if (preset === "week") {
            return listVistsThisWeek(consultantId);
        }

        if (preset === "month") {
            return listVistsThisMonth(consultantId);
        }

        return listLast30Visits(consultantId);
    }

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

                            <select className="agenda-consultant-select" onChange={handleSelectConsultant}>
                                <option value="">Todos os Consultores</option>
                                {
                                    consultants.map(consultant => (
                                        <option value={consultant.id}>{consultant.firstName} {consultant.lastName}</option>
                                    ))
                                }
                            </select>
                        </div>

                        {
                            tabOpen === "list" ?
                            <div className="agenda-quick-filters">
                                <button className={presetFilter === "today" ? "agenda-filter-btn is-active" : "agenda-filter-btn"} data-filter="today" onClick={handleSelectPresetFilter}>Hoje</button>
                                <button className={presetFilter === "week" ? "agenda-filter-btn is-active" : "agenda-filter-btn"} data-filter="week" onClick={handleSelectPresetFilter}>Esta Semana</button>
                                <button className={presetFilter === "month" ? "agenda-filter-btn is-active" : "agenda-filter-btn"} data-filter="month" onClick={handleSelectPresetFilter}>Este Mês</button>
                                <button className={presetFilter === "all" ? "agenda-filter-btn is-active" : "agenda-filter-btn"} data-filter="all" onClick={handleSelectPresetFilter}>Todos</button>
                            </div>
                            : ""
                        }
                        
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
                                    <h3>{visits.length} agendamentos encontrados</h3>
                                    </div>

                                    <div className="agenda-list">
                                        {
                                            visits.map((visit) => (

                                            <div
                                              className="agenda-item"
                                              key={visit.id}
                                              onClick={() => openViewScheduling(visit.id)}
                                            >
                                                <div className="agenda-item-main">
                                                    <div className="agenda-item-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
                                                            <path d="M17.6546 19.5122V17.6539C17.6546 16.6682 17.2631 15.7228 16.5661 15.0258C15.8691 14.3288 14.9237 13.9373 13.938 13.9373H8.3631C7.37739 13.9373 6.43205 14.3288 5.73505 15.0258C5.03805 15.7228 4.64648 16.6682 4.64648 17.6539V19.5122" stroke="#228BC3" stroke-width="1.85831" stroke-linecap="round" stroke-linejoin="round"/>
                                                            <path d="M11.1502 10.2206C13.2028 10.2206 14.8668 8.5566 14.8668 6.50397C14.8668 4.45134 13.2028 2.78735 11.1502 2.78735C9.09758 2.78735 7.43359 4.45134 7.43359 6.50397C7.43359 8.5566 9.09758 10.2206 11.1502 10.2206Z" stroke="#228BC3" stroke-width="1.85831" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    </div>

                                                    <div className="agenda-item-info">
                                                        <p className="agenda-item-title">{visit.visit_type}</p>
                                                        <p className="agenda-item-sub">{
                                                            (() => {
                                                                const consultant = consultants.find(c => c.id === visit.creator_id);
                                                                return consultant ? `${consultant.firstName} ${consultant.lastName}` : "Consultor desconhecido";
                                                            })()
                                                        }</p>
                                                        <p className="agenda-item-sub">{visit.college_name}</p>
                                                    </div>
                                                </div>

                                                <div className="agenda-item-meta">
                                                <div className="agenda-item-date">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                    <path d="M8.9137 16.353C13.019 16.353 16.3469 13.0251 16.3469 8.9198C16.3469 4.81454 13.019 1.48657 8.9137 1.48657C4.80844 1.48657 1.48047 4.81454 1.48047 8.9198C1.48047 13.0251 4.80844 16.353 8.9137 16.353Z" stroke="#737B8C" stroke-width="1.48665" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M8.91797 4.45996V8.9199L11.8913 10.4065" stroke="#737B8C" stroke-width="1.48665" stroke-linecap="round" stroke-linejoin="round"/>
                                                    </svg>
                                                    <span>{
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
                                                    }</span>
                                                </div>

                                                <div className="agenda-item-extra">
                                                    <span>
                                                      Duração: {
                                                        (() => {
                                                          if (!visit.init_visit_time || !visit.end_visit_time) return "—";

                                                          const start = parseLocalSqlDateTime(visit.init_visit_time);
                                                          const end = parseLocalSqlDateTime(visit.end_visit_time);

                                                          if (!start || !end) return "—";

                                                          const diffMs = end.getTime() - start.getTime();
                                                          if (diffMs <= 0) return "—";

                                                          const minutes = Math.floor(diffMs / 60000);
                                                          const hours = Math.floor(minutes / 60);
                                                          const remainingMinutes = minutes % 60;

                                                          return hours > 0
                                                            ? `${hours}h ${remainingMinutes}min`
                                                            : `${minutes}min`;
                                                        })()
                                                      }
                                                    </span>
                                                    <span className={`agenda-badge agenda-status-${visit.status}`}>
                                                      {parsedStatus[visit.status] || visit.status}
                                                    </span>
                                                </div>
                                                </div>
                                            </div>
                                            ))
                                        }
                                        
                                    </div>
                                </div>
                            </div>
                            :
                            <div className="agenda-calendar-panel">
                                <div className="agenda-calendar-grid">
                                {/* CALENDÁRIO MENSAL */}

                                <div className="agenda-calendar-card agenda-calendar-month">
                                    <AdminDatePicker
                                      selectedDate={selectedDate}
                                      onChange={handleDateChange}
                                      consultantId={selectedConsultantId}
                                    />
                                </div>

                                {/* VISÃO SEMANAL */}
                                <div className="agenda-calendar-card agenda-calendar-week">
                                    <div className="agenda-calendar-header is-inline">
                                    <h3>Visão Semanal</h3>

                                    <div className="agenda-week-nav">
                                        <button onClick={handlePrevWeek}>‹</button>
                                        <span>{formatWeekRange(weekRange)}</span>
                                        <button onClick={handleNextWeek}>›</button>
                                    </div>
                                    </div>

                                    <div className="agenda-week-grid">
                                      {Array.from({ length: 7 }).map((_, index) => {
                                        const dayDate = new Date(weekRange.start);
                                        dayDate.setDate(weekRange.start.getDate() + index);

                                        const dayKey = formatDateInAppTimeZone(dayDate);
                                        const dayVisits = weekVisits[dayKey] || [];

                                        return (
                                          <div
                                            key={dayKey}
                                            className={`agenda-week-day ${
                                              dayKey === formatDateInAppTimeZone(new Date()) ? "is-today" : ""
                                            }`}
                                          >
                                            <div className="agenda-week-day-header">
                                              <span>
                                                {dayDate.toLocaleDateString("pt-BR", { weekday: "long" })}
                                              </span>
                                              <strong>{dayDate.getDate()}</strong>
                                            </div>

                                            {dayVisits.map((visit) => {
                                              const parsedTime = parseLocalSqlDateTime(visit.init_visit_time);
                                              const time = parsedTime
                                                ? parsedTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                                                : "--:--";
                                              const consultant = consultants.find(c => c.id === visit.creator_id);
                                              const consultantName = consultant ? `${consultant.firstName} ${consultant.lastName}` : "Consultor desconhecido";
                                              return (
                                                <div
                                                  key={visit.id}
                                                  className="agenda-week-event"
                                                  title={`(${visit.visit_type}) ${visit.college_name} - ${consultantName}`}
                                                  onClick={() => openViewScheduling(visit.id)}
                                                >
                                                  <strong>{time}</strong>
                                                  <span>{visit.visit_type}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                </div>

                                </div>
                            </div>
                            } 
                        </div>  
                </div>
            </div>
            <NewSchedulingForm opened={newSchedFormOpen} onClose={() => setNewSchedFormOpen(false)} />
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
        </React.Fragment>
    )
}

export default CoordinatorAgendaPage
