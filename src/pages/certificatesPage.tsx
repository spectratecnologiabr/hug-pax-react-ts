import React, { useState, useEffect } from "react"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { getOverviewData } from "../controllers/dash/overview.controller"
import { getCourseById } from "../controllers/course/getCourse.controller"
import { getCookies } from "../controllers/misc/cookies.controller"
import { getDocumentData } from "../controllers/certificates/getDocumentData.controller"

import AsideMenu from "../components/asideMenu"
import Footer from "../components/footer"

import { listCertificates } from "../controllers/certificates/listCertificates.controller"

import "../style/certificates.css"

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TCertificate = {
    certificateCode: string,
    courseId: number,
    createdAt: string,
    expiresAt: string | null,
    hours: number,
    id: number,
    issuedAt: string,
    metadata: any,
    status: string,
    updatedAt: string
    userId: number
}

function Certificates() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ certificates, setCertificates ] = useState<TCertificate[]>([]);
    const [ coursesMap, setCoursesMap ] = useState<Record<number, string>>({});
    const userData = getCookies("userData");

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchCoursesTitles(certificatesData: TCertificate[]) {
            try {
                const courses = await Promise.all(
                    certificatesData.map(c =>
                        getCourseById(c.courseId).then(course => ({
                            id: c.courseId,
                            title: course.title
                        }))
                    )
                );

                const map: Record<number, string> = {};
                courses.forEach(c => {
                    map[c.id] = c.title;
                });

                setCoursesMap(map);
            } catch (error) {
                console.error("Error fetching courses titles:", error);
            }
        }

        async function fetchCertificates() {
            try {
                const certificatesData = await listCertificates();
                setCertificates(certificatesData);
                fetchCoursesTitles(certificatesData);
            } catch (error) {
                console.error("Error fetching certificates:", error);
            }
        }

        fetchCertificates();
        fetchOverviewData();
    }, [])

    async function printCertificate(data: TCertificate) {
        const documentData = await getDocumentData(data.certificateCode);
        if (!documentData) return;

        const {
            certificateCode,
            userName,
            courseTitle,
            hours,
            issuedAt,
            modules
        } = documentData;

        const issuedDate = new Date(issuedAt).toLocaleDateString("pt-BR");

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Certificado</title>
                    <style>
                        @page {
                            size: A4 landscape;
                            margin: 0;
                        }
                        html, body {
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            background: #fff;
                            font-family: 'Poppins', Arial, sans-serif;
                            color: #2b2b2b;
                        }
                        .cert {
                            width: 1123px;
                            height: 794px;
                            display: flex;
                            flex-direction: column;
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                            background: #fff;
                            font-family: 'Poppins', Arial, sans-serif;
                            color: #2b2b2b;
                        }
                        .header {
                            height: 160px;
                            background-color: #f47c2c;
                            display: flex;
                            align-items: center;
                            justify-content: flex-end;
                            padding: 0 100px;
                            color: #fff;
                            font-size: 48px;
                            font-weight: 800;
                            letter-spacing: 1px;
                            box-sizing: border-box;
                            margin: 0;
                            padding-top: 0;
                            line-height: 1;
                        }
                        .content {
                            flex: 1;
                            padding: 60px 140px 40px;
                            text-align: center;
                            box-sizing: border-box;
                            font-size: 18px;
                            line-height: 1.7;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                        }
                        .content > .guide-text {
                            color: #f47c2c;
                            font-size: 18px;
                            margin-bottom: 12px;
                        }
                        .student {
                            font-size: 36px;
                            font-weight: 800;
                            margin: 6px 0 12px;
                            color: #000;
                        }
                        .course {
                            font-size: 26px;
                            font-weight: 700;
                            margin: 6px 0 18px;
                            color: #000;
                        }
                        .content .sub-guide {
                            color: #f47c2c;
                            font-size: 18px;
                            margin-bottom: 12px;
                        }
                        .modules {
                            margin: 30px auto 0;
                            width: 80%;
                            text-align: left;
                        }
                        .modules-title {
                            font-weight: 600;
                            margin-bottom: 6px;
                            display: block;
                        }
                        .modules ul {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                            background: #ededed;
                            border-radius: 10px;
                            overflow: hidden;
                        }
                        .modules li {
                            padding: 14px 18px;
                            font-size: 16px;
                            border-bottom: 1px solid #cfcfcf;
                        }
                        .modules li:last-child {
                            border-bottom: none;
                        }
                        .footer {
                            padding: 30px 100px 40px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 14px;
                            color: #333;
                            box-sizing: border-box;
                        }
                        .code {
                            font-size: 13px;
                            color: #333;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                    </style>
                </head>
                <body>
                    <div class="cert" id="cert-main">
                        <div class="header">CERTIFICADO</div>
                        <div class="content">
                            <div class="guide-text">Certificamos para os devidos fins que</div>
                            <div class="student">${userName}</div>
                            <span class="sub-guide">concluiu, com êxito, o(a):</span>
                            <div class="course">${courseTitle}</div>
                            <span>
                                realizado pela Hug Education com carga horária total de <b>${hours} horas</b>
                            </span>
                        </div>
                        <div class="footer">
                            <div>
                                Emitido em ${issuedDate}
                            </div>
                            <div class="code">
                                Código de validação: ${certificateCode}
                            </div>
                        </div>
                    </div>
                    ${
                        modules?.length
                            ? `
                            <div class="cert page-break" id="cert-modules">
                                <div class="content" style="justify-content: flex-start;">
                                    <span class="modules-title" style="font-size:22px; margin-top:40px; margin-bottom: 18px;">Eixos e vivências trabalhadas:</span>
                                    <div class="modules" style="margin-top:0;">
                                        <ul>
                                            ${modules.map((m: string, idx: number) =>
                                                `<li style="border-bottom:${idx === modules.length-1 ? "none" : "1px solid #cfcfcf"};">${m}</li>`
                                            ).join("")}
                                        </ul>
                                    </div>
                                </div>
                                <div class="footer">
                                    <div>
                                        Emitido em ${issuedDate}
                                    </div>
                                    <div class="code">
                                        Código de validação: ${certificateCode}
                                    </div>
                                </div>
                            </div>
                            `
                            : ""
                    }
                    <script>
                        window.onload = function () {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    async function downloadCertificate(data: TCertificate) {
        const documentData = await getDocumentData(data.certificateCode);
        if (!documentData) return;

        const {
            certificateCode,
            userName,
            courseTitle,
            hours,
            issuedAt,
            modules
        } = documentData;

        const issuedDate = new Date(issuedAt).toLocaleDateString("pt-BR");

        // criar container oculto
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        // Primeira página: certificado principal
        const certMainId = "certificate-main";
        // Segunda página: módulos
        const certModulesId = "certificate-modules";
        container.innerHTML = `
            <div id="${certMainId}"
                style="
                    width:1123px;
                    height:794px;
                    display:flex;
                    flex-direction:column;
                    box-sizing:border-box;
                    margin:0;
                    padding:0;
                    overflow:hidden;
                    background:#fff;
                    font-family:'Poppins', Arial, sans-serif;
                    color:#2b2b2b;
                "
            >
                <!-- Header -->
                <div
                    style="
                        height:160px;
                        background-color:#f47c2c;
                        display:flex;
                        align-items:center;
                        justify-content:flex-end;
                        padding:0 100px;
                        color:#fff;
                        font-size:48px;
                        font-weight:800;
                        letter-spacing:1px;
                        box-sizing:border-box;
                        margin:0;
                        padding-top:0;
                        line-height:1;
                    "
                >
                    CERTIFICADO
                </div>
                <!-- Content -->
                <div
                    style="
                        flex:1;
                        padding:60px 140px 40px;
                        text-align:center;
                        box-sizing:border-box;
                        font-size:18px;
                        line-height:1.7;
                        display:flex;
                        flex-direction:column;
                        justify-content:center;
                    "
                >
                    <div
                        style="
                            color:#f47c2c;
                            font-size:18px;
                            margin-bottom:12px;
                        "
                    >
                        Certificamos para os devidos fins que
                    </div>
                    <div
                        style="
                            font-size:36px;
                            font-weight:800;
                            margin:6px 0 12px;
                            color:#000;
                        "
                    >
                        ${userName}
                    </div>
                    <span style="
                            color:#f47c2c;
                            font-size:18px;
                            margin-bottom:12px;"
                        >
                        concluiu, com êxito, o(a):
                    </span>
                    <div
                        style="
                            font-size:26px;
                            font-weight:700;
                            margin:6px 0 18px;
                            color:#000;
                        "
                    >
                        ${courseTitle}
                    </div>
                    <span>
                        realizado pela Hug Education com carga horária total de <b>${hours} horas</b>
                    </span>
                </div>
                <!-- Footer -->
                <div
                    style="
                        padding:30px 100px 40px;
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        font-size:14px;
                        color:#333;
                        box-sizing:border-box;
                    "
                >
                    <div>
                        Emitido em ${issuedDate}
                    </div>
                    <div
                        style="
                            font-size:13px;
                            color:#333;
                        "
                    >
                        Código de validação: ${certificateCode}
                    </div>
                </div>
            </div>
            ${
                modules?.length
                    ? `
                    <div id="${certModulesId}"
                        style="
                            width:1123px;
                            height:794px;
                            display:flex;
                            flex-direction:column;
                            box-sizing:border-box;
                            margin:0;
                            padding:0;
                            overflow:hidden;
                            background:#fff;
                            font-family:'Poppins', Arial, sans-serif;
                            color:#2b2b2b;
                        "
                    >
                        <div
                            style="
                                flex:1;
                                padding:60px 140px 40px;
                                text-align:center;
                                box-sizing:border-box;
                                font-size:18px;
                                line-height:1.7;
                                display:flex;
                                flex-direction:column;
                                justify-content:flex-start;
                            "
                        >
                            <span style="font-size:22px; font-weight:600; margin-top:40px; margin-bottom: 18px;">Eixos e vivências trabalhadas:</span>
                            <div
                                style="
                                    margin:0 auto 0;
                                    width:80%;
                                    text-align:left;
                                "
                            >
                                <ul
                                    style="
                                        list-style:none;
                                        padding:0;
                                        margin:0;
                                        background:#ededed;
                                        border-radius:10px;
                                        overflow:hidden;
                                    "
                                >
                                    ${modules.map((m: string, idx: number) =>
                                        `<li style="
                                            padding:14px 18px;
                                            font-size:16px;
                                            border-bottom:${idx === modules.length-1 ? "none" : "1px solid #cfcfcf"};
                                        ">${m}</li>`
                                    ).join("")}
                                </ul>
                            </div>
                        </div>
                        <div
                            style="
                                padding:30px 100px 40px;
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                font-size:14px;
                                color:#333;
                                box-sizing:border-box;
                            "
                        >
                            <div>
                                Emitido em ${issuedDate}
                            </div>
                            <div
                                style="
                                    font-size:13px;
                                    color:#333;
                                "
                            >
                                Código de validação: ${certificateCode}
                            </div>
                        </div>
                    </div>
                    `
                    : ""
            }
        `;
        document.body.appendChild(container);

        // gerar PDF com DUAS páginas
        const elementMain = container.querySelector(`#${certMainId}`) as HTMLElement;
        const elementModules = modules?.length ? (container.querySelector(`#${certModulesId}`) as HTMLElement) : null;
        const pdf = new jsPDF("landscape", "pt", "a4");
        // Página 1
        const canvasMain = await html2canvas(elementMain);
        const imgDataMain = canvasMain.toDataURL("image/png");
        pdf.addImage(imgDataMain, "PNG", 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height);
        // Página 2 (se houver módulos)
        if (elementModules) {
            pdf.addPage();
            const canvasModules = await html2canvas(elementModules);
            const imgDataModules = canvasModules.toDataURL("image/png");
            pdf.addImage(imgDataModules, "PNG", 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height);
        }
        pdf.save(`${userName}-${courseTitle}-certificate.pdf`);
        document.body.removeChild(container);
    }

    return (
        <React.Fragment>
            <div className="certificates-container">
                <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="certificates-wrapper">
                    <div className="page-title-wrapper">
                        <b>Certificados</b>
                    </div>
                    <div className="certificates-listing">
                      {certificates.length === 0 && (
                        <span className="empty-message">
                          Você ainda não possui certificados emitidos.
                        </span>
                      )}

                      {certificates.map(certificate => (
                        <div key={certificate.id} className="certificate-card">
                          <div className="certificate-info">
                            <b>
                              Curso - {coursesMap[certificate.courseId] ?? "Carregando curso..."}
                            </b>
                            <span>Código: {certificate.certificateCode}</span>
                            <span>Carga horária: {certificate.hours}h</span>
                            <span>Status: {certificate.status === "issued" ? "Emitido" : ""}</span>
                            <span>
                              Data de conclusão:{' '}
                              {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="certificate-actions">
                            {
                                //<a href={`/certificates/validate/${certificate.certificateCode}`} target="_blank" rel="noopener noreferrer">
                                // Validar
                                //</a>
                            }
                          <button
                              className="download-button"
                              onClick={() => downloadCertificate(certificate)}
                          >
                                <svg height="22" viewBox="0 0 19 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.7293 8.11765H13.5714V1.35294C13.5714 0.608823 12.9607 0 12.2143 0H6.78571C6.03929 0 5.42857 0.608823 5.42857 1.35294V8.11765H3.27071C2.06286 8.11765 1.45214 9.57882 2.30714 10.4312L8.53643 16.6412C9.06571 17.1688 9.92071 17.1688 10.45 16.6412L16.6793 10.4312C17.5343 9.57882 16.9371 8.11765 15.7293 8.11765ZM0 21.6471C0 22.3912 0.610714 23 1.35714 23H17.6429C18.3893 23 19 22.3912 19 21.6471C19 20.9029 18.3893 20.2941 17.6429 20.2941H1.35714C0.610714 20.2941 0 20.9029 0 21.6471Z" fill="#323232"/>
                                </svg>
                            </button>
                            <button className="print-button" onClick={() => printCertificate(certificate)}>
                                <svg height="22" viewBox="0 0 30 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M25.5 7.5H4.5C2.01 7.5 0 9.51 0 12V18C0 19.65 1.35 21 3 21H6V24C6 25.65 7.35 27 9 27H21C22.65 27 24 25.65 24 24V21H27C28.65 21 30 19.65 30 18V12C30 9.51 27.99 7.5 25.5 7.5ZM19.5 24H10.5C9.675 24 9 23.325 9 22.5V16.5H21V22.5C21 23.325 20.325 24 19.5 24ZM25.5 13.5C24.675 13.5 24 12.825 24 12C24 11.175 24.675 10.5 25.5 10.5C26.325 10.5 27 11.175 27 12C27 12.825 26.325 13.5 25.5 13.5ZM22.5 0H7.5C6.675 0 6 0.675 6 1.5V4.5C6 5.325 6.675 6 7.5 6H22.5C23.325 6 24 5.325 24 4.5V1.5C24 0.675 23.325 0 22.5 0Z" fill="#323232"/>
                                </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
            </div>
            <Footer />
        </React.Fragment>
    )
}

export default Certificates