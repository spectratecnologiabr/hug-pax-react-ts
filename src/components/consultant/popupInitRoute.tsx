import React, { useEffect, useState } from "react";
import { updateVisit } from "../../controllers/consultant/updateVisit.controller";

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

function PopupInitRoute(props: { 
    opened: boolean;
    onClose: () => void;
    visitId: number
}) {
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

    async function handleInitRoute() {
        function buildDateTimeWithOffset(date: Date) {
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
        }

        try {
            const { lat, lng } = await getCurrentLocation();

            const now = new Date();

            const payload = {
                initRouteCoordinates: { lat, lng },
                initRouteTime: buildDateTimeWithOffset(now),
                status: "on course"
            };

            await updateVisit(props.visitId, payload);

            handleModalMessage({ isError: false, message: "Deslocamento iniciado!" });
            props.onClose();
        } catch (error) {
            console.error("Erro ao iniciar trajeto:", error);
            handleModalMessage({ isError: true, message: String(error) });
        }
    }

    return (
        <React.Fragment>
            <div className={`scheduling-form-container ${props.opened ? 'visible' : ''}`}>
                <div className="scheduling-form">
                    <div className="scheduling-body">
                        <div className="form-wrapper">
                            <span>Tem certeza que deseja iniciar o trajeto?</span>
                        </div>
                        
                        <div className="form-wrapper container">
                            <button className="go-button" onClick={handleInitRoute}>Sim, iniciar</button>
                            <button className="cancel-button" onClick={props.onClose}>Não, cancelar</button>
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
export default PopupInitRoute