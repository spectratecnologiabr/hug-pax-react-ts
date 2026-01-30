import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getDocumentData } from "../controllers/certificates/getDocumentData.controller" 

import authCertIcon from "../img/auth-cert-icon.svg"

import "../style/authCertificate.css"

type TCertificate = {
    certificateCode: string,
    userName: string,
    courseTitle: string,
    hours: number,
    issuedAt: string,
    modules: Array<string>
}

function AuthCertificate() {
    const params = useParams();
    const certCode = params.code as string
    const [certificateData, setCertificateData] = useState<TCertificate | null>(null);

    useEffect(() => {
        async function fetchCertificateData() {
            try {
                const certData = await getDocumentData(certCode);
                console.log(certData)
                setCertificateData(certData);
            } catch (error) {
                console.error("Error fetching certificate data:", error);
            }
        }

        fetchCertificateData();
    }, [])

    return (
        <div className="auth-cert-page">
            <header className="auth-cert-header">
                <div className="logo">
                    <img src={authCertIcon} alt="" />
                </div>
                <h1>Autenticação de Certificado</h1>
            </header>

            <div className="auth-cert-card">
                <div className="auth-cert-status">
                    <span className="status-icon">✓</span>
                    <span>Certificado válido e autenticado</span>
                </div>

                <div className="auth-cert-info">
                    <div><strong>Nome do participante:</strong> <b>{certificateData?.userName}</b></div>
                    <div><strong>Curso / Formação:</strong> {certificateData?.courseTitle}</div>
                    <div><strong>Instituição emissora:</strong> Hug Education</div>
                    <div><strong>Carga horária:</strong> {certificateData?.hours} horas</div>
                    <div><strong>Tipo de documento:</strong> Certificado de Conclusão</div>
                </div>

                <div className="auth-cert-description">
                    Certificamos para os devidos fins que o(a) participante concluiu, com êxito,
                    a formação Vivências em Educação Socioemocional, realizada pela Hug Education.
                </div>
            </div>
        </div>
    )
}

export default AuthCertificate