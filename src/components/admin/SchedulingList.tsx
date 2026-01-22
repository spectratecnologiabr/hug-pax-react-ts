import React, { useState, useEffect } from "react";
import { listSchedulings } from "../../controllers/consultant/listSchedulings.controller";
import { visitsToday } from "../../controllers/consultant/visitsToday.controller";
import { visitsThisWeek } from "../../controllers/consultant/visitsThisWeek.controller";
import { visitsThisMonth } from "../../controllers/consultant/visitsThisMonth.controller";

import NewSchedulingForm from "./NewSchedulingForm";
import ViewSchedulingForm from "./ViewSchedulingForm";

import "../../style/schedulingList.css";

function SchedulingList(props: { selectedDate?: Date }) {
    const [ schedulings, setSchedulings ] = useState([] as any[]);
    const [ newSchedulingFormOpened, setNewSchedulingFormOpened ] = useState<boolean>(false);
    const [ viewSchedulingFormOpened, setViewSchedulingFormOpened ] = useState<boolean>(false);
    const [ openedSchedulingId, setOpenedSchedulingId ] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [range, setRange] = useState("hoje")

    // VISITS FILTER POPUP STATE
    const [filtersOpen, setFiltersOpen] = useState(false);
    const filtersRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSchedulings = async () => {
            try {
                const formatLocalDate = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${year}-${month}-${day}`;
                };

                const dateParam = props.selectedDate
                  ? formatLocalDate(props.selectedDate)
                  : formatLocalDate(new Date());

                const data = await listSchedulings(dateParam);
                setSchedulings(data);
            } catch (error) {
                console.error("Error fetching schedulings:", error);
            }
        };

        fetchSchedulings();
    }, [props.selectedDate, refreshKey]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
          setFiltersOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function viewScheduling(event: React.MouseEvent<HTMLButtonElement>) {
        setOpenedSchedulingId(Number(event.currentTarget.dataset.schedulingId));
        setViewSchedulingFormOpened(true)
    }

    function openVisitForm(event: React.MouseEvent<HTMLButtonElement>) {
        const visitId = event.currentTarget.dataset.schedulingId;

        window.location.pathname = `/admin/consultant/visit/${visitId}`
    }

    function openVisitPDF(event: React.MouseEvent<HTMLButtonElement>) {
        const visitId = event.currentTarget.dataset.schedulingId;
        if (!visitId) return;

        window.open(
            `/admin/visits/${visitId}/report-preview`,
            "_blank",
            "noopener,noreferrer"
        );
    }

    async function handleVisitsToday() {
        try {
            const data = await visitsToday();
            setSchedulings(data);
            setRange("hoje");
        } catch (error) {
            console.error("Erro ao buscar visitas de hoje:", error);
        }
    }

    async function handleVisitsThisWeek() {
        try {
            const data = await visitsThisWeek();
            setSchedulings(data);
            setRange("essa semana");
        } catch (error) {
            console.error("Erro ao buscar visitas da semana:", error);
        }
    }

    async function handleVisitsThisMonth() {
        try {
            const data = await visitsThisMonth();
            setSchedulings(data);
            setRange("esse mês")
        } catch (error) {
            console.error("Erro ao buscar visitas do mês:", error);
        }
    }

    return (
        <React.Fragment>
            <div className="scheduling-container">
                <div className="header-wrapper">
                    <b>Próximos Agendamentos</b>
                    <div>
                        {schedulings.length} visita(s) agendada(s) para {range}
                    </div>
                </div>
                
                <div className="buttons-wrapper">
                    <button className="show-filter" onClick={() => setFiltersOpen(prev => !prev)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M0.12781 0.97245C1.5291 2.77239 3.60084 5.43605 3.60084 5.43605V8.45608C3.60084 9.12049 4.14445 9.66409 4.80886 9.66409C5.47326 9.66409 6.01687 9.12049 6.01687 8.45608V5.43605C6.01687 5.43605 8.08861 2.77239 9.4899 0.97245C9.79795 0.573806 9.51406 0 9.0067 0H0.604975C0.10365 0 -0.180233 0.573806 0.12781 0.97245Z" fill="#323232"/>
                        </svg>
                        <span>Filtros</span>
                    </button>

                    <button onClick={() => setNewSchedulingFormOpened(true)} className="new-schedule">
                        + Nova visita
                    </button>
                </div>

                <div className="visits-filter" ref={filtersRef}>
                  <div className={`visits-filter-popup ${filtersOpen ? "active" : ""}`}>
                    <button onClick={() => { handleVisitsToday(); setFiltersOpen(false); }}>
                      Hoje
                    </button>

                    <button onClick={() => { handleVisitsThisWeek(); setFiltersOpen(false); }}>
                      Essa semana
                    </button>

                    <button onClick={() => { handleVisitsThisMonth(); setFiltersOpen(false); }}>
                      Esse mês
                    </button>
                  </div>
                </div>
                <div className="scheduling-list">
                    {
                        schedulings.length === 0 ? (
                            <div className="scheduling-item">
                                    <div>
                                        <p>Nenhum agendamento para a data selecionada.</p>
                                    </div>
                                </div>
                        ) : (
                            schedulings.map((scheduling: any) => {
                              const statusMap: Record<string, { label: string; className: string }> = {
                                scheduled: { label: "Não iniciada", className: "status-pending" },
                                rescheduled: { label: "Reagendada", className: "status-pending" },
                                "on course": { label: "A caminho", className: "status-pending" },
                                "in progress": { label: "Em andamento", className: "status-progress" },
                                cancelled: { label: "Cancelada", className: "status-cancelled" },
                                completed: { label: "Concluída", className: "status-completed" },
                              };

                              const statusInfo = statusMap[scheduling.status] || { label: "Desconhecido", className: "status-pending" };

                              const parseLocalDateTime = (dateTimeStr: string) => {
                                if (!dateTimeStr) return null;
                                const [datePart, timePart = "00:00:00"] = dateTimeStr.split(" ");
                                const [year, month, day] = datePart.split("-").map(Number);
                                const [hour, minute, second] = timePart.split(":").map(Number);
                                return new Date(year, month - 1, day, hour, minute, second || 0);
                              };

                              const initDate = parseLocalDateTime(scheduling.init_visit_time);

                              return (
                                <div className="schedule-card" key={scheduling.id}>
                                  <div className="schedule-time">
                                    {initDate
                                      ? initDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                                      : "--:--"}
                                  </div>

                                  <div className="schedule-info">
                                    <strong>{scheduling.college_name} | {scheduling.city}</strong>
                                    <span>{scheduling.visit_type}</span>
                                  </div>

                                  <div className={`schedule-status ${statusInfo.className}`}>
                                    {statusInfo.label}
                                  </div>

                                  <div className="schedule-actions">
                                    <span className={`status-dot ${statusInfo.className}`} />
                                    {
                                      scheduling.status === "in progress" ? (
                                        <button data-scheduling-id={scheduling.id} onClick={openVisitForm}>›</button>
                                      ) : scheduling.status === "completed" ? (
                                        <button data-scheduling-id={scheduling.id} onClick={openVisitPDF}>›</button>
                                      ) : scheduling.status !== "cancelled" ? (
                                        <button data-scheduling-id={scheduling.id} onClick={viewScheduling}>›</button>
                                      ) : null
                                    }
                                  </div>
                                </div>
                              );
                            })
                        )
                    }
                </div>

                
            </div>
            <NewSchedulingForm
                opened={newSchedulingFormOpened}
                onClose={() => setNewSchedulingFormOpened(false)}
            />

            <ViewSchedulingForm
                opened={viewSchedulingFormOpened}
                onClose={() => { setViewSchedulingFormOpened(false); setRefreshKey(prev => prev + 1)}}
                visitId={openedSchedulingId}
                onCancelled={() => setRefreshKey(prev => prev + 1)}
                onRescheduled={() => setRefreshKey(prev => prev + 1)}
            />

        </React.Fragment>
    );
}

export default SchedulingList;