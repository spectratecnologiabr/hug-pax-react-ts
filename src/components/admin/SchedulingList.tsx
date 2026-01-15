import React, { useState, useEffect } from "react";
import { listSchedulings } from "../../controllers/consultant/listSchedulings.controller";

import "../../style/schedulingList.css";

function SchedulingList(props: { selectedDate?: string }) {
    const [schedulings, setSchedulings] = useState([] as any[]);

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
    }, [props.selectedDate]);

    return (
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
                            <div className="scheduling-item" key={scheduling.id}>
                                <div>
                                    <b>
                                        {scheduling.college_name} | {scheduling.city}
                                        <span> (
                                            {(() => {
                                                const statusMap: Record<string, string> = {
                                                    scheduled: "Agendado",
                                                    rescheduled: "Reagendado",
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
                                <button data-scheduling-id={scheduling.id}>
                                    Ver
                                </button>
                            </div>
                        ))
                    )
                }
            </div>

            <button className="new-scheduling-button">Novo Agendamento</button>
        </div>
    );
}

export default SchedulingList;