import React, { useEffect, useState } from "react";
import { getRadar } from "../../controllers/consultant/getRadar.controller";
import "../../style/evolutionRadar.css";

type RadarStatus = "evolved" | "stable" | "regressed";

function getRadarIcon(status: RadarStatus) {
    switch (status) {
        case "evolved":
            return "📈";
        case "stable":
            return "➖";
        case "regressed":
            return "📉";
        default:
            return "";
    }
}

function formatVisitDate(dateStr: string) {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    });
}

interface RadarItem {
    collegeId: number;
    collegeName: string;
    lastVisitDate: string;
    radar: {
        engagement: RadarStatus;
        teacherDomain: RadarStatus;
        managementSupport: RadarStatus;
    };
}

function EvolutionRadar() {
    const [data, setData] = useState<RadarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRadar() {
            try {
                const response = await getRadar();
                setData(response);
            } finally {
                setLoading(false);
            }
        }
        loadRadar();
    }, []);

    if (loading) {
        return <div className="evolution-radar-card">Carregando evolução...</div>;
    }

    return (
        <div className="evolution-radar-card">
            <div className="radar-header">
                <h3>Evolução das Escolas</h3>
                <span className="radar-subtitle">Última visita registrada</span>
            </div>

            <div className="radar-list">
                {data.map((item) => (
                    <div key={item.collegeId} className="radar-row">
                        <div className="radar-college">
                            <strong>{item.collegeName}</strong>
                            <span>{formatVisitDate(item.lastVisitDate)}</span>
                        </div>

                        <div className="radar-status-group">
                            <span className={`radar-status ${item.radar.engagement}`}>
                                {getRadarIcon(item.radar.engagement)} Engajamento
                            </span> 
                            <span className={`radar-status ${item.radar.teacherDomain}`}>
                                {getRadarIcon(item.radar.teacherDomain)} Domínio Docente
                            </span>
                            <span className={`radar-status ${item.radar.managementSupport}`}>
                                {getRadarIcon(item.radar.managementSupport)} Gestão
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EvolutionRadar;