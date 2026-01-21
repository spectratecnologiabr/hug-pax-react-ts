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
        } catch (error) {
            console.error("Erro ao buscar visitas de hoje:", error);
        }
    }

    async function handleVisitsThisWeek() {
        try {
            const data = await visitsThisWeek();
            setSchedulings(data);
        } catch (error) {
            console.error("Erro ao buscar visitas da semana:", error);
        }
    }

    async function handleVisitsThisMonth() {
        try {
            const data = await visitsThisMonth();
            setSchedulings(data);
        } catch (error) {
            console.error("Erro ao buscar visitas do mês:", error);
        }
    }

    return (
        <React.Fragment>
            <div className="scheduling-container">
                <div className="buttons-container">
                    <button onClick={handleVisitsToday}>
                        Hoje
                    </button>

                    <button onClick={handleVisitsThisWeek}>
                        Essa Semana
                    </button>

                    <button onClick={handleVisitsThisMonth}>
                        Esse Mês
                    </button>

                    <button onClick={() => setNewSchedulingFormOpened(true)}>
                        Novo Agendamento
                    </button>
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
                            schedulings.map((scheduling: any) => (
                                <div className={(scheduling.status === "cancelled") ? "scheduling-item cancelled" : "scheduling-item"} key={scheduling.id}>
                                    <div>
                                        <b>
                                            {scheduling.college_name} | {scheduling.city}
                                            <span> (
                                                {(() => {
                                                    const statusMap: Record<string, string> = {
                                                        scheduled: "Agendado",
                                                        rescheduled: "Reagendado",
                                                        "on course": "A caminho",
                                                        "in progress": "Em andamento",
                                                        cancelled: "Cancelado",
                                                        completed: "Concluído",
                                                    };
                                                    return statusMap[scheduling.status as string] || "Desconhecido";
                                                })()}
                                            )</span>
                                        </b>
                                        <p>
                                            {(() => {
                                                const [year, month, day] = scheduling.visit_date.split("-").map(Number);
                                                return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                });
                                            })()} | {(() => {
                                                const parseLocalDateTime = (dateTimeStr: string) => {
                                                if (!dateTimeStr) return null;
                                                const [datePart, timePart = "00:00:00"] = dateTimeStr.split(" ");
                                                const [year, month, day] = datePart.split("-").map(Number);
                                                const [hour, minute, second] = timePart.split(":").map(Number);
                                                return new Date(year, month - 1, day, hour, minute, second || 0);
                                                };
                                                const initDate = parseLocalDateTime(scheduling.init_visit_time);
                                                return initDate ? initDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
                                            })()} - {(() => {
                                                const parseLocalDateTime = (dateTimeStr: string) => {
                                                if (!dateTimeStr) return null;
                                                const [datePart, timePart = "00:00:00"] = dateTimeStr.split(" ");
                                                const [year, month, day] = datePart.split("-").map(Number);
                                                const [hour, minute, second] = timePart.split(":").map(Number);
                                                return new Date(year, month - 1, day, hour, minute, second || 0);
                                                };
                                                const endDate = parseLocalDateTime(scheduling.end_visit_time);
                                                return endDate ? endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
                                            })()}
                                        </p>
                                    </div>

                                    {

                                        scheduling.status === "in progress" ? (
                                            <button data-scheduling-id={scheduling.id} onClick={openVisitForm}>
                                                Abrir
                                            </button>
                                        ) : scheduling.status === "completed" ? (
                                            <button data-scheduling-id={scheduling.id} onClick={openVisitPDF}>
                                                Abrir
                                            </button>
                                        ) : scheduling.status !== "cancelled" ? (
                                            <button data-scheduling-id={scheduling.id} onClick={viewScheduling}>
                                                Ver
                                            </button>
                                        ) : ""
                                    }
                                </div>
                            ))
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