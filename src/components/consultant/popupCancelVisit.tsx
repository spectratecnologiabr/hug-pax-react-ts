import React, { useState } from "react";
import { updateVisit } from "../../controllers/consultant/updateVisit.controller";

import "../../style/schedulingForm.css";

type TCanellmentInfo = {
    cancelReason: string,
    status: string
}

function PopupCancelVisit(props: { 
    opened: boolean; 
    onClose: () => void; 
    onCancelled: () => void;
    visitId: number 
}) {
    const [ updateData, setUpdateData ] = useState<TCanellmentInfo>({ cancelReason: "", status: "cancelled" })
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

    function handleUpdateData( event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { value } = event.currentTarget;

        setUpdateData(prev => ({
            ...prev,
            cancelReason: value
        }));
    }

    async function sendCancellment() {
        await updateVisit(props.visitId, updateData)
                .then(response => {
                    if (response[0].changedRows > 0) {
                        handleModalMessage({ isError: false, message: "Visita cancelada!" });
                        props.onClose();
                        props.onCancelled();
                    }
                })
    }

    return (
        <React.Fragment>
            <div className={`scheduling-form-container ${props.opened ? 'visible' : ''}`}>
                <div className="scheduling-form">
                    <div className="scheduling-header">
                        <b>Cancelar agendamento</b>
                        <button onClick={props.onClose}>Voltar</button>
                    </div>

                    <div className="scheduling-body">
                        <div className="form-wrapper">
                            <span>Tem certeza que deseja cancelar essa visita?</span>
                            <b>Essa ação não pode ser desfeita!</b>
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="cancelReason">Informe o motivo do cancelamento</label>
                            <textarea id="cancelReason" className="cancelReason" rows={4} onChange={handleUpdateData}></textarea>
                        </div>
                        
                        <div className="form-wrapper container">
                            <button className="cancel-button" onClick={sendCancellment}>Confirmar cancelamento</button>
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

export default PopupCancelVisit