import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { getConsultanOverviewData } from "../controllers/dash/consultantOverview.controller";

import Menubar from "../components/consultant/menubar";
import AdminDatePicker from "../components/consultant/AdminDatePicker";
import SchedulingList from "../components/consultant/SchedulingList";
import EvolutionRadar from "../components/consultant/evolutionRadar";
import DigitalBriefcase, { type TDigitalBriefcaseFile } from "../components/consultant/DigitalBriefcase";
import { getBriefcaseFiles, type TBriefcaseFile } from "../controllers/consultant/getBriefcaseFiles.controller";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TConsultantOverviewData = {
    activeColleges: number,
    activeEducators: number,
    scheduledThisMonth: number,
    rescheduledThisMonth: number,
    cancelledThisMonth: number,
    completedThisMonth: number
}

function ConsultantDash() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
    const [consultantOverviewData, setConsultantOverviewData] = useState<TConsultantOverviewData | null>(null);
    const [briefcaseFiles, setBriefcaseFiles] = useState<Array<TDigitalBriefcaseFile>>([]);

    function normalizeBriefcaseType(value: unknown): TDigitalBriefcaseFile["type"] {
        if (typeof value !== "string") return undefined;
        const normalized = value.toLowerCase();
        if (normalized.includes("pdf")) return "pdf";
        if (normalized.includes("xls")) return "xlsx";
        if (normalized.includes("doc")) return "doc";
        if (normalized.includes("ppt")) return "ppt";
        if (normalized.includes("link")) return "link";
        if (normalized.includes("file")) return "file";
        return undefined;
    }

    function mapBriefcaseFile(file: TBriefcaseFile & Record<string, any>): TDigitalBriefcaseFile {
        const name =
            String(
                file.name ??
                file.fileName ??
                file.originalName ??
                file.title ??
                "Arquivo"
            );

        const rawUrl = file.url ?? file.fileUrl ?? file.downloadUrl;
        const fileKey = file.fileKey ?? file.path;
        const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
        const cdnBase = (process.env.REACT_APP_CDN_URL || "").replace(/\/+$/, "");
        const cdnPrefix = `${cdnBase}/api/stream/`;
        const url =
            typeof rawUrl === "string" && rawUrl.trim()
                ? rawUrl.startsWith(cdnPrefix)
                    ? `${apiBase}/files/stream/${encodeURIComponent(decodeURIComponent(rawUrl.slice(cdnPrefix.length)))}`
                    : rawUrl.startsWith("https://") || rawUrl.startsWith("http://")
                        ? rawUrl
                        : `${apiBase}/files/stream/${encodeURIComponent(rawUrl)}`
                : typeof fileKey === "string" && fileKey.trim()
                  ? `${apiBase}/files/stream/${encodeURIComponent(fileKey)}`
                  : undefined;
        const type = file.type ?? file.fileType ?? file.mimeType ?? file.extension ?? file.ext;
        const mimeType = file.mimeType ?? file.mimetype ?? file.contentType;

        return {
            id: file.id ?? name,
            name,
            url,
            mimeType: typeof mimeType === "string" ? mimeType : undefined,
            type: normalizeBriefcaseType(type),
        };
    }

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchConsultamtOverviewData() {
            try {
                const fetchedData = await getConsultanOverviewData();
                setConsultantOverviewData(fetchedData);
            } catch (error) {
                console.error("Error fetching consultant overview data:", error);
            }
        }

        async function fetchBriefcaseFiles() {
            try {
                const files = await getBriefcaseFiles();
                const normalized = (Array.isArray(files) ? files : []).map(mapBriefcaseFile);
                setBriefcaseFiles(normalized);
            } catch (error) {
                console.error("Error fetching briefcase files:", error);
                setBriefcaseFiles([]);
            }
        }

        fetchConsultamtOverviewData()
        fetchOverviewData()
        fetchBriefcaseFiles()
    }, []);

    function handleDateChange(date: Date | null) {
        setSelectedDate(date || new Date());
    }

    const formatDate = (date: string) => {
        const d = new Date(date);

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();

        return `${dia}/${mes}/${ano}`;
    };

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="main-dash-wrapper">
                        <div className="row">
                            <div className="cards-list">
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.9075 9.9V12.71C2.9075 13.44 3.3075 14.12 3.9475 14.47L8.9475 17.2C9.5475 17.53 10.2675 17.53 10.8675 17.2L15.8675 14.47C16.5075 14.12 16.9075 13.44 16.9075 12.71V9.9L10.8675 13.2C10.2675 13.53 9.5475 13.53 8.9475 13.2L2.9075 9.9ZM8.9475 0.24L0.5175 4.84C-0.1725 5.22 -0.1725 6.22 0.5175 6.6L8.9475 11.2C9.5475 11.53 10.2675 11.53 10.8675 11.2L18.9075 6.81V12.72C18.9075 13.27 19.3575 13.72 19.9075 13.72C20.4575 13.72 20.9075 13.27 20.9075 12.72V6.31C20.9075 5.94 20.7075 5.61 20.3875 5.43L10.8675 0.24C10.2675 -0.08 9.5475 -0.08 8.9475 0.24Z" fill="#89A626"/>
                                        </svg>
                                    </div>

                                    <b>{consultantOverviewData?.activeColleges}</b>
                                    <span>ESCOLAS ATIVAS</span>
                                </div>
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8.69644 11.596C9.84318 11.596 10.9642 11.256 11.9176 10.6189C12.8711 9.98177 13.6143 9.07625 14.0531 8.0168C14.4919 6.95736 14.6068 5.79157 14.383 4.66687C14.1593 3.54217 13.6071 2.50906 12.7962 1.6982C11.9854 0.887333 10.9523 0.335127 9.82757 0.11141C8.70287 -0.112308 7.53709 0.00251219 6.47764 0.441349C5.41819 0.880186 4.51267 1.62333 3.87558 2.57681C3.23848 3.53028 2.89844 4.65127 2.89844 5.79801C2.89997 7.33526 3.51132 8.80911 4.59833 9.89612C5.68533 10.9831 7.15919 11.5945 8.69644 11.596ZM8.69644 1.93267C9.46093 1.93267 10.2083 2.15937 10.8439 2.5841C11.4796 3.00882 11.975 3.61251 12.2675 4.31881C12.5601 5.0251 12.6366 5.80229 12.4875 6.55209C12.3384 7.3019 11.9702 7.99063 11.4296 8.53121C10.8891 9.07179 10.2003 9.43992 9.45053 9.58907C8.70073 9.73821 7.92354 9.66167 7.21724 9.36911C6.51094 9.07655 5.90726 8.58112 5.48253 7.94547C5.0578 7.30982 4.83111 6.5625 4.83111 5.79801C4.83111 4.77285 5.23834 3.78969 5.96324 3.0648C6.68813 2.33991 7.67129 1.93267 8.69644 1.93267Z" fill="#89A626"/>
                                            <path d="M8.697 13.5293C6.3912 13.5319 4.18057 14.449 2.55012 16.0794C0.919668 17.7099 0.00255774 19.9205 0 22.2263C0 22.4826 0.10181 22.7284 0.283033 22.9096C0.464255 23.0908 0.710046 23.1926 0.966334 23.1926C1.22262 23.1926 1.46841 23.0908 1.64963 22.9096C1.83086 22.7284 1.93267 22.4826 1.93267 22.2263C1.93267 20.4323 2.64534 18.7118 3.9139 17.4432C5.18245 16.1746 6.90299 15.462 8.697 15.462C10.491 15.462 12.2116 16.1746 13.4801 17.4432C14.7487 18.7118 15.4613 20.4323 15.4613 22.2263C15.4613 22.4826 15.5631 22.7284 15.7444 22.9096C15.9256 23.0908 16.1714 23.1926 16.4277 23.1926C16.684 23.1926 16.9298 23.0908 17.111 22.9096C17.2922 22.7284 17.394 22.4826 17.394 22.2263C17.3914 19.9205 16.4743 17.7099 14.8439 16.0794C13.2134 14.449 11.0028 13.5319 8.697 13.5293Z" fill="#89A626"/>
                                        </svg>
                                    </div>
                                    
                                    <b>{consultantOverviewData?.activeEducators}</b>
                                    <span>EDUCADORES ATIVOS</span>
                                </div>
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 9.53C12.71 9.24 12.23 9.24 11.94 9.53L7.59 13.88L6 12.29C5.71 12 5.23 12 4.94 12.29C4.65 12.58 4.65 13.06 4.94 13.35L6.88 15.29C7.27 15.68 7.9 15.68 8.29 15.29L12.99 10.59C13.29 10.3 13.29 9.82 13 9.53ZM16 2H15V1C15 0.45 14.55 0 14 0C13.45 0 13 0.45 13 1V2H5V1C5 0.45 4.55 0 4 0C3.45 0 3 0.45 3 1V2H2C0.89 2 0.00999999 2.9 0.00999999 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM15 18H3C2.45 18 2 17.55 2 17V7H16V17C16 17.55 15.55 18 15 18Z" fill="#89A626"/>
                                        </svg>
                                    </div>

                                    <b>{consultantOverviewData?.scheduledThisMonth}</b>
                                    <span>AGENDAMENTOS DESSE MÊS</span>
                                </div>
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 2H15V1C15 0.45 14.55 0 14 0C13.45 0 13 0.45 13 1V2H5V1C5 0.45 4.55 0 4 0C3.45 0 3 0.45 3 1V2H2C0.89 2 0.00999999 2.9 0.00999999 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM15 18H3C2.45 18 2 17.55 2 17V7H16V17C16 17.55 15.55 18 15 18Z" fill="#89A626"/>
                                            <path d="M9 17C10.105 17 11.1 16.545 11.82 15.82L12.575 16.575C12.73 16.73 13 16.62 13 16.395L13 14.25C13 14.11 12.89 14 12.75 14L10.605 14C10.38 14 10.27 14.27 10.43 14.425L11.125 15.12C10.575 15.66 9.83 16 9 16C7.805 16 6.77 15.3 6.29 14.285C6.21 14.115 6.055 14 5.87 14L5.775 14C5.435 14 5.22 14.355 5.365 14.66C5.995 16.04 7.385 17 9 17ZM5 8.605L5 10.75C5 10.89 5.11 11 5.25 11L7.395 11C7.62 11 7.73 10.73 7.57 10.575L6.875 9.88C7.425 9.34 8.17 9 9 9C10.195 9 11.23 9.7 11.71 10.715C11.79 10.885 11.945 11 12.13 11L12.22 11C12.56 11 12.775 10.645 12.63 10.34C12.005 8.96 10.615 8 9 8C7.895 8 6.9 8.455 6.18 9.18L5.425 8.425C5.27 8.27 5 8.38 5 8.605Z" fill="#89A626"/>
                                        </svg>
                                    </div>

                                    <b>{consultantOverviewData?.rescheduledThisMonth}</b>
                                    <span>REAGENDAMENTOS DESSE MÊS</span>
                                </div>
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6.84 15.47L8.75 13.56L10.66 15.47C10.95 15.76 11.43 15.76 11.72 15.47C12.01 15.18 12.01 14.7 11.72 14.41L9.81 12.5L11.72 10.59C12.01 10.3 12.01 9.82 11.72 9.53C11.43 9.24 10.95 9.24 10.66 9.53L8.75 11.44L6.84 9.53C6.55 9.24 6.07 9.24 5.78 9.53C5.49 9.82 5.49 10.3 5.78 10.59L7.69 12.5L5.78 14.41C5.49 14.7 5.49 15.18 5.78 15.47C6.07 15.76 6.55 15.76 6.84 15.47ZM16 2H15V1C15 0.45 14.55 0 14 0C13.45 0 13 0.45 13 1V2H5V1C5 0.45 4.55 0 4 0C3.45 0 3 0.45 3 1V2H2C0.89 2 0.00999999 2.9 0.00999999 4L0 18C0 19.1 0.89 20 2 20H16C17.1 20 18 19.1 18 18V4C18 2.9 17.1 2 16 2ZM15 18H3C2.45 18 2 17.55 2 17V7H16V17C16 17.55 15.55 18 15 18Z" fill="#89A626"/>
                                        </svg>
                                    </div>
                                    
                                    <b>{consultantOverviewData?.cancelledThisMonth}</b>
                                    <span>CANCELAMENTOS DESSE MÊS</span>
                                </div>
                                <div className="card-item">
                                    <div className="img-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20" fill="none">
                                            <path d="M19.2931 3.8941L9.29305 13.8941C8.90305 14.2841 8.27305 14.2841 7.88305 13.8941L5.05305 11.0641C4.66305 10.6741 4.66305 10.0441 5.05305 9.6541C5.44305 9.2641 6.07305 9.2641 6.46305 9.6541L8.58305 11.7741L17.8731 2.4841C18.2631 2.0941 18.8931 2.0941 19.2831 2.4841C19.6831 2.8741 19.6831 3.5041 19.2931 3.8941ZM10.0031 18.0041C5.29305 18.0041 1.52305 13.9141 2.05305 9.1041C2.44305 5.5841 5.17305 2.6941 8.66305 2.1141C10.4731 1.8141 12.1931 2.1341 13.6531 2.8941C14.0431 3.0941 14.5131 3.0241 14.8231 2.7141C15.3031 2.2341 15.1831 1.4241 14.5831 1.1141C13.1131 0.364095 11.4531 -0.0459044 9.68305 0.00409556C4.54305 0.164096 0.273052 4.3441 0.0130525 9.4741C-0.276948 15.2441 4.30305 20.0041 10.0031 20.0041C11.2031 20.0041 12.3431 19.7941 13.4131 19.4041C14.0931 19.1541 14.2831 18.2741 13.7631 17.7541C13.4931 17.4841 13.0831 17.3841 12.7231 17.5241C11.8731 17.8341 10.9531 18.0041 10.0031 18.0041ZM17.0031 13.0041H15.0031C14.4531 13.0041 14.0031 13.4541 14.0031 14.0041C14.0031 14.5541 14.4531 15.0041 15.0031 15.0041H17.0031V17.0041C17.0031 17.5541 17.4531 18.0041 18.0031 18.0041C18.5531 18.0041 19.0031 17.5541 19.0031 17.0041V15.0041H21.0031C21.5531 15.0041 22.0031 14.5541 22.0031 14.0041C22.0031 13.4541 21.5531 13.0041 21.0031 13.0041H19.0031V11.0041C19.0031 10.4541 18.5531 10.0041 18.0031 10.0041C17.4531 10.0041 17.0031 10.4541 17.0031 11.0041V13.0041Z" fill="#89A626"/>
                                        </svg>
                                    </div>
                                    

                                    <b>{consultantOverviewData?.completedThisMonth}</b>
                                    <span>VISITAS REALIZADAS ESSE MÊS</span>
                                </div>
                            </div>
                            <AdminDatePicker selectedDate={selectedDate} onChange={handleDateChange} />
                        </div>
                        <div className="row">
                            <EvolutionRadar />
                            <SchedulingList selectedDate={selectedDate}/>
                        </div>
                    </div>
                </div>
                <DigitalBriefcase files={briefcaseFiles} />
            </div>
        </React.Fragment>
    )
}

export default ConsultantDash
