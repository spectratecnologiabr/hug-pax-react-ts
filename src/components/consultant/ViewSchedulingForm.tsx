import React, { useState, useEffect } from "react";
import { findVisit } from "../../controllers/consultant/findVisit.controller";
import { updateVisit } from "../../controllers/consultant/updateVisit.controller";

import PopupCancelVisit from "./popupCancelVisit";
import PopupReschedulingVisit from "./popupReschedulingVisit";
import PopupInitRoute from "./popupInitRoute";

import "../../style/schedulingForm.css";

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocalização não suportada neste dispositivo");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            error => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject("Permissão de localização negada");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject("Localização indisponível no dispositivo");
                        break;
                    case error.TIMEOUT:
                        reject("Tempo limite para obter a localização");
                        break;
                    default:
                        reject("Erro desconhecido ao obter localização");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        );
    });
}

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
    onRescheduled: () => void;
    visitId: number 
}) {
    const [ schedulingData, setSchedulingData ] = useState<Partial<TScheduling>>({})
    const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
    const [isReschedulingPopupOpen, setIsReschedulingPopupOpen] = useState(false);
    const [isInitRoutePopupOpen, setIsInitRoutePopupOpen] = useState(false)
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
        async function getVisitData() {
            try {
                const visitData = await findVisit(props.visitId);
                setSchedulingData(visitData);
            } catch (error) {
                console.error("Error fetching visit data:", error);
            }
        }

        if (props.opened && props.visitId) {
            getVisitData();
        }
    }, [props.opened, props.visitId]);

    function formatDate(value?: string) {
      if (!value) return "";
      return value.split("T")[0];
    }

    function formatTime(value?: string) {
      if (!value) return "";
      return value.split("T")[1]?.substring(0, 5) || "";
    }

    async function handleInitVisit() {
        try {
            const { lat, lng } = await getCurrentLocation();

            const buildDateTimeWithOffset = (date: Date) => {
                const offsetMinutes = date.getTimezoneOffset();
                const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60)
                    .toString()
                    .padStart(2, "0");
                const offsetMins = (Math.abs(offsetMinutes) % 60)
                    .toString()
                    .padStart(2, "0");

                const sign = offsetMinutes > 0 ? "-" : "+";

                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const dd = String(date.getDate()).padStart(2, "0");
                const hh = String(date.getHours()).padStart(2, "0");
                const mi = String(date.getMinutes()).padStart(2, "0");
                const ss = String(date.getSeconds()).padStart(2, "0");

                return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${offsetHours}:${offsetMins}`;
            };

            const now = new Date();

            const payload = {
                endRouteTime: buildDateTimeWithOffset(now),
                endRouteCoordinates: { lat, lng },
                initVisitTime: buildDateTimeWithOffset(now),
                status: "in progress"
            };

            await updateVisit(props.visitId, payload);

            handleModalMessage({ isError: false, message: "Visita iniciada!" });
            props.onClose();
        } catch (error) {
            console.error("Erro ao obter localização:", error);
            handleModalMessage({ isError: true, message: String(error) });
        }
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
                            {
                                (schedulingData.status !== "on course") ? 
                                <React.Fragment>
                                    <button className="rescheduling-button" onClick={() => setIsReschedulingPopupOpen(true)}>Reagendar</button>
                                    <button className="go-button" onClick={() => setIsInitRoutePopupOpen(true)}>Iniciar Deslocamento</button>
                                    <button className="cancel-button" onClick={() => setIsCancelPopupOpen(true)}>Cancelar</button>
                                </React.Fragment>
                                 : <button className="go-button" onClick={handleInitVisit}>Iniciar Visita</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
            <PopupCancelVisit opened={isCancelPopupOpen} onClose={() => { setIsCancelPopupOpen(false); props.onClose(); }} onCancelled={props.onCancelled} visitId={props.visitId} />
            <PopupInitRoute opened={isInitRoutePopupOpen} onClose={() => { setIsInitRoutePopupOpen(false); props.onClose() }} visitId={props.visitId} />
            <PopupReschedulingVisit opened={isReschedulingPopupOpen} onClose={() => { setIsReschedulingPopupOpen(false); props.onClose(); }} onRescheduled={props.onRescheduled} visitId={props.visitId} lastVisitDate={schedulingData.visitDate || ""} lastReschedulingCount={Number(schedulingData.reschedulingAmount)} />
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

export default ViewSchedulingForm;