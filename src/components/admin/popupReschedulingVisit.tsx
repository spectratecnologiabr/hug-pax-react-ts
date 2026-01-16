import React, { useEffect, useState } from "react";
import { updateVisit } from "../../controllers/consultant/updateVisit.controller";

import "../../style/schedulingForm.css";

type TReschedulingInfo = {
    visitDate: string,
    initVisitTime: string,
    endVisitTime: string,
    lastVisitDate: string,
    lastReschedulingReason: string,
    reschedulingAmount: number,
    status: string
}

function PopupReschedulingVisit(props: { 
    opened: boolean;
    onClose: () => void; 
    onRescheduled: () => void;
    visitId: number,
    lastVisitDate: string,
    lastReschedulingCount: number
}) {
    const [ updateData, setUpdateData ] = useState<TReschedulingInfo>({ 
        visitDate: "", 
        initVisitTime: "",
        endVisitTime: "",
        lastVisitDate: props.lastVisitDate,
        lastReschedulingReason: "", 
        reschedulingAmount: Number(props.lastReschedulingCount + 1), 
        status: "rescheduled" });

    useEffect(() => {
        if (props.opened) {
            setUpdateData(prev => ({
                ...prev,
                lastVisitDate: props.lastVisitDate,
                reschedulingAmount: Number(props.lastReschedulingCount) + 1
            }));
        }
    }, [props.opened, props.lastVisitDate, props.lastReschedulingCount]);

    function handleUpdateData(
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = event.currentTarget;

        setUpdateData(prev => ({
            ...prev,
            [name]: name === "reschedulingAmount"
                ? Number(value)
                : value
        }));
    }

    async function rescheduleVisit() {
        if (!updateData.visitDate || !updateData.initVisitTime || !updateData.endVisitTime) {
            alert("Preencha a data e os horários antes de confirmar.");
            return;
        }

        const initDateTime = `${updateData.visitDate} ${updateData.initVisitTime}:00`;
        const endDateTime = `${updateData.visitDate} ${updateData.endVisitTime}:00`;

        const payload = {
            ...updateData,
            initVisitTime: initDateTime,
            endVisitTime: endDateTime
        };

        await updateVisit(props.visitId, payload)
            .then(response => {
                if (response[0].changedRows > 0) {
                    alert("Visita reagendada!");
                    props.onClose();
                    props.onRescheduled();
                }
            });
    }

    return (
        <div className={`scheduling-form-container ${props.opened ? 'visible' : ''}`}>
            <div className="scheduling-form">
                <div className="scheduling-header">
                    <b>Reagendar Visita</b>
                    <button onClick={props.onClose}>Voltar</button>
                </div>

                <div className="scheduling-body">
                    <div className="form-wrapper">
                        <span>Tem certeza que deseja reagendar essa visita?</span>
                        <b>Essa ação não pode ser desfeita!</b>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="visitDate">Nova data</label>
                        <input type="date" name="visitDate" id="visitDate" onChange={handleUpdateData} />
                    </div>
                    <div className="form-wrapper container">
                        <div>
                            <label htmlFor="initVisitTime">Previsão de início</label>
                            <input type="time" name="initVisitTime" id="initVisitTime" onChange={handleUpdateData} />
                        </div>
                        <div>
                            <label htmlFor="endVisitTime">Previsão de término</label>
                            <input type="time" name="endVisitTime" id="endVisitTime" onChange={handleUpdateData} />
                        </div>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="lastReschedulingReason">Informe o motivo do reagendamento</label>
                        <textarea
                            id="lastReschedulingReason"
                            name="lastReschedulingReason"
                            className="lastReschedulingReason"
                            rows={4}
                            onChange={handleUpdateData}
                        ></textarea>
                    </div>
                    
                    <div className="form-wrapper container">
                        <button className="cancel-button" onClick={rescheduleVisit}>Confirmar reagendamento</button>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default PopupReschedulingVisit