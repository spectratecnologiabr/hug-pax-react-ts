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
                        alert("Visita cancelada!")
                        props.onClose();
                        props.onCancelled();
                    }
                })
    }

    return (
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
    )
}

export default PopupCancelVisit