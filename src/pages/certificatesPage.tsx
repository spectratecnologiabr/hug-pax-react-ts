import React, { useState, useEffect } from "react"
import { getOverviewData } from "../controllers/dash/overview.controller"
import { getCourseById } from "../controllers/course/getCourse.controller"

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
                              Emitido em:{' '}
                              {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="certificate-actions">
                            <a href={`/certificates/validate/${certificate.certificateCode}`} target="_blank" rel="noopener noreferrer">
                              Validar
                            </a>
                            <button>
                                <svg height="22" viewBox="0 0 19 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M15.7293 8.11765H13.5714V1.35294C13.5714 0.608823 12.9607 0 12.2143 0H6.78571C6.03929 0 5.42857 0.608823 5.42857 1.35294V8.11765H3.27071C2.06286 8.11765 1.45214 9.57882 2.30714 10.4312L8.53643 16.6412C9.06571 17.1688 9.92071 17.1688 10.45 16.6412L16.6793 10.4312C17.5343 9.57882 16.9371 8.11765 15.7293 8.11765ZM0 21.6471C0 22.3912 0.610714 23 1.35714 23H17.6429C18.3893 23 19 22.3912 19 21.6471C19 20.9029 18.3893 20.2941 17.6429 20.2941H1.35714C0.610714 20.2941 0 20.9029 0 21.6471Z" fill="#323232"/>
                                </svg>
                            </button>
                            <button>
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