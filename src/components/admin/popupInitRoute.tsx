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

            alert("Deslocamento iniciado!");
            props.onClose();
        } catch (error) {
            console.error("Erro ao iniciar trajeto:", error);
            alert(String(error));
        }
    }

    return (
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
    )
}
export default PopupInitRoute