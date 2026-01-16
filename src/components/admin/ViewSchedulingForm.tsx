import React, { useState, useEffect } from "react";
import { findVisit } from "../../controllers/consultant/findVisit.controller";

import PopupCancelVisit from "./popupCancelVisit";

import "../../style/schedulingForm.css";

type TScheduling = {
    id: number,
	collegeId: number,
	creatorId: number,
    institutionProfile: string,
    visitType: string,
	collegeName: string,
	collegeAddress: string,
	collegeNumber: number,
	city: string,
	manager: string,
	visitDate: string,
	lastVisitDate: string,
	lastReschedulingReason: string,
	reschedulingAmount: number,
	cancelReason: string,
	guestConsultants: any[],
	initRouteTime: string,
	initRouteCoordinates: string,
	endRouteTime: string,
	endRouteCoordinates: string,
	initVisitTime: string,
	endVisitTime: string,
	visitObservations: string,
	schedulingObservations: string,
	photos: any[],
	status: string,
	createdAt: string,
	updatedAt: string
}

function ViewSchedulingForm(props: { 
    opened: boolean; 
    onClose: () => void; 
    onCancelled: () => void;
    visitId: number 
}) {
    const [ schedulingData, setSchedulingData ] = useState<Partial<TScheduling>>({})
    const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);

    useEffect(() => {
        async function getVisitData() {
            try {
                const visitData = await findVisit(props.visitId);
                setSchedulingData(visitData);
            } catch (error) {
                console.error("Error fetching visit data:", error)
            }
        }

        getVisitData()
    })

    function formatDate(value?: string) {
      if (!value) return "";
      return value.split("T")[0];
    }

    function formatTime(value?: string) {
      if (!value) return "";
      return value.split("T")[1]?.substring(0, 5) || "";
    }

    return (
        <React.Fragment>
            <div className={`scheduling-form-container ${props.opened ? 'visible' : ''}`}>
                <div className="scheduling-form">
                    <div className="scheduling-header">
                        <b>Ver agendamento</b>
                        <button onClick={props.onClose}>Voltar</button>
                    </div>

                    <div className="scheduling-body">
                        <div className="form-wrapper">
                            <label htmlFor="collegeId">Selecione a Escola</label>
                            <input type="text" id="collegeId" value={schedulingData.collegeName} disabled />
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="collegeAddress">Endereço</label>
                            <input type="text" id="collegeAddress" value={schedulingData.collegeAddress} disabled />
                        </div>
                        <div className="form-wrapper container">
                            <div>
                                <label htmlFor="collegeNumber">Número</label>
                                <input type="text" id="collegeNumber" value={schedulingData.collegeNumber} disabled />
                            </div>
                            <div>
                                <label htmlFor="city">Cidade</label>
                                <input type="text" id="city" value={schedulingData.city} disabled />
                            </div>
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="manager">Selecione o Gestor Escolar</label>
                            <input type="text" id="manager" value={schedulingData.manager} disabled />
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="institutionProfile">Perfil da Instituição</label>
                            <select name="institutionProfile" id="institutionProfile" value={schedulingData.institutionProfile} disabled>
                                <option value="">Selecione um tipo</option>
                                <option value="Implantação">Implantação (Ano 1)</option>
                                <option value="Veterana">Veterana (Ano 2+)</option>
                            </select>
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="visitType">Tipo da Visita</label>
                            <select name="visitType" id="visitType" value={schedulingData.visitType} disabled>
                                <option value="">Selecione um tipo</option>
                                <option value="Visita Inicial">Visita Inicial</option>
                                <option value="Acompanhamento">Acompanhamento</option>
                                <option value="Capacitação">Capacitação</option>
                                <option value="Formação Inicial">Formação Inicial</option>
                                <option value="Av. Pré Teste">Avaliação Pré-Teste</option>
                                <option value="Av. Pós Teste">Avaliação Pós-Teste</option>
                                <option value="Distribuição">Distribuição</option>
                            </select>
                        </div>
                        <div className="form-wrapper container">
                            <div>
                                <label htmlFor="visitDate">Data do Agendamento</label>
                                <input type="date" id="visitDate" className="visitDate" value={formatDate(schedulingData.visitDate)} disabled/>
                            </div>
                            <div>
                                <label htmlFor="initVisitTime">Previsão de Início</label>
                                <input type="time" id="initVisitTime" className="initVisitTime" value={formatTime(schedulingData.initVisitTime)} disabled />
                            </div>
                            <div>
                                <label htmlFor="endVisitTime">Previsão de Término</label>
                                <input type="time" id="endVisitTime" className="endVisitTime" value={formatTime(schedulingData.endVisitTime)} disabled/>
                            </div>
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="guestConsultants">Convidados</label>
                            <textarea name="guestConsultants" id="guestConsultants" disabled value={schedulingData.guestConsultants?.map(consultant => `${consultant}\n`)}></textarea>
                        </div>
                        <div className="form-wrapper">
                            <label htmlFor="schedulingObservations">Notas Adicionais</label>
                            <textarea id="schedulingObservations" className="schedulingObservations" rows={4} value={schedulingData.schedulingObservations} disabled></textarea>
                        </div>
                        <div className="form-wrapper container">
                            <button className="rescheduling-button">Reagendar</button>
                            <button className="go-button">Iniciar Deslocamento</button>
                            <button
                                className="cancel-button"
                                onClick={() => setIsCancelPopupOpen(true)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <PopupCancelVisit
                opened={isCancelPopupOpen}
                onClose={() => {
                    setIsCancelPopupOpen(false);
                    props.onClose();
                }}
                onCancelled={props.onCancelled}
                visitId={props.visitId}
            />
        </React.Fragment>
    )
}

export default ViewSchedulingForm;