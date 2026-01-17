import React, { useState, useEffect } from "react";
import { listSchedulings } from "../../controllers/consultant/listSchedulings.controller";

import NewSchedulingForm from "./NewSchedulingForm";
import ViewSchedulingForm from "./ViewSchedulingForm";

import "../../style/schedulingList.css";

function SchedulingList(props: { selectedDate?: string }) {
    const [ schedulings, setSchedulings ] = useState([] as any[]);
    const [ newSchedulingFormOpened, setNewSchedulingFormOpened ] = useState<boolean>(false);
    const [ viewSchedulingFormOpened, setViewSchedulingFormOpened ] = useState<boolean>(false);
    const [ openedSchedulingId, setOpenedSchedulingId ] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchSchedulings = async () => {
            try {
                const dateParam = props.selectedDate
                  ? props.selectedDate.split("T")[0]
                  : new Date().toISOString().split("T")[0];

                const data = await listSchedulings(dateParam);
                setSchedulings(data);
                console.log("Fetched schedulings:", data);
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

    return (
        <React.Fragment>
            <div className="scheduling-container">
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
                                        <p>{new Date(scheduling.visit_date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {new Date(scheduling.init_visit_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(scheduling.end_visit_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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

                <button className="new-scheduling-button" onClick={() => setNewSchedulingFormOpened(true)}>Novo Agendamento</button>
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