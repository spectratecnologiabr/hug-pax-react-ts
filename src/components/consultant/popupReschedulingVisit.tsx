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
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");

    function handleModalMessage(data: { isError: boolean; message: string }) {
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(data.isError);
        if (messageElement) {
            messageElement.textContent = data.message;
        } else {
            setMessage(data.message);
        }
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
    }

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
            handleModalMessage({
                isError: true,
                message: "Preencha a data e os horários antes de confirmar."
            });
            return;
        }

        const buildDateTimeWithOffset = (date: string, time: string) => {
            const [year, month, day] = date.split("-").map(Number);
            const [hour, minute] = time.split(":").map(Number);

            const localDate = new Date(year, month - 1, day, hour, minute, 0);

            const offsetMinutes = localDate.getTimezoneOffset();
            const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
                .toString()
                .padStart(2, "0");
            const offsetMins = (Math.abs(offsetMinutes) % 60)
                .toString()
                .padStart(2, "0");

            const sign = offsetMinutes > 0 ? "-" : "+";

            const yyyy = localDate.getFullYear();
            const mm = String(localDate.getMonth() + 1).padStart(2, "0");
            const dd = String(localDate.getDate()).padStart(2, "0");
            const hh = String(localDate.getHours()).padStart(2, "0");
            const mi = String(localDate.getMinutes()).padStart(2, "0");
            const ss = "00";

            return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${offsetHours}:${offsetMins}`;
        };

        const initDateTime = buildDateTimeWithOffset(
            updateData.visitDate,
            updateData.initVisitTime
        );

        const endDateTime = buildDateTimeWithOffset(
            updateData.visitDate,
            updateData.endVisitTime
        );

        const payload = {
            ...updateData,
            initVisitTime: initDateTime,
            endVisitTime: endDateTime
        };

        await updateVisit(props.visitId, payload)
            .then(response => {
                if (response[0].changedRows > 0) {
                    handleModalMessage({
                        isError: false,
                        message: "Visita reagendada!"
                    });
                    props.onClose();
                    props.onRescheduled();
                }
            });
    }

    return (
        <React.Fragment>
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
            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    )

}

export default PopupReschedulingVisit