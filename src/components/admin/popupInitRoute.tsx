import React, { useEffect, useState } from "react";
import { updateVisit } from "../../controllers/consultant/updateVisit.controller";

import "../../style/schedulingForm.css";

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject("Geolocalização não suportada");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => {
                reject("Permissão de localização negada");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
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
        try {
            const { lat, lng } = await getCurrentLocation();

            const now = new Date();
            const formattedDateTime = new Date(
                now.getTime() - now.getTimezoneOffset() * 60000
            )
                .toISOString()
                .replace("T", " ")
                .substring(0, 19);

            const payload = {
                initRouteCoordinates: JSON.stringify({ lat, lng }),
                initRouteTime: formattedDateTime,
                status: "on course"
            };

            await updateVisit(props.visitId, payload);

            alert("Deslocamento iniciado!");
            props.onClose();
        } catch (error) {
            alert("Não foi possível obter a localização do dispositivo.");
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