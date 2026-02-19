import React, { useState, useEffect, useRef } from "react";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { findCollege } from "../controllers/college/findCollege.controller";
import { ICollegeProps } from "../controllers/college/createCollege.controller";

import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";
import { listTeachingGradesAdmin } from "../controllers/education/listTeachingGradesAdmin.controller";

import ConsultantMenubar from "../components/consultant/menubar";
import AdminMenubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TConsultant = {
    id: number;
    firstName: string;
    lastName: string;
}

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean };
type TeachingGrade = { id: number; modalityId: number; name: string; order: number; isActive?: boolean };

function normalizeContractSeries(value: unknown): string[] {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return value.split(",").map((v: string) => v.trim());
        }
    }

    return [];
}

function ViewCollegeData() {
    const isAdminPanel = window.location.pathname.startsWith("/admin");
    const collegeId = useParams().collegeId as string;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ collegeData, setCollegeData ] = useState<ICollegeProps>({} as ICollegeProps);
    const [isSegmentOpen, setIsSegmentOpen] = useState(false);
    const [isSeriesOpen, setIsSeriesOpen] = useState(false);
    const [consultants, setConsultants] = useState<TConsultant[]>([]);

    const segmentRef = useRef<HTMLDivElement | null>(null);
    const seriesRef = useRef<HTMLDivElement | null>(null);

    const [segments, setSegments] = useState<{ value: string; label: string }[]>([]);
    const [SERIES_BY_SEGMENT, setSeriesBySegment] = useState<Record<string, { value: string; label: string }[]>>({});

    useEffect(() => {
      let alive = true;
      (async () => {
        try {
          const modalitiesResp = await listTeachingModalitiesAdmin();
          const modalities: TeachingModality[] = Array.isArray(modalitiesResp?.data) ? modalitiesResp.data : modalitiesResp;
          const activeModalities = (modalities || []).filter((m) => m.isActive !== false);
          const segmentOptions = activeModalities.map((m) => ({ value: String(m.id), label: m.name }));
          const gradesEntries = await Promise.all(
            activeModalities.map(async (m) => {
              const gradesResp = await listTeachingGradesAdmin(m.id);
              const grades: TeachingGrade[] = Array.isArray(gradesResp?.data) ? gradesResp.data : gradesResp;
              const options = (grades || []).filter((g) => g.isActive !== false).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((g) => ({ value: String(g.id), label: g.name }));
              return [String(m.id), options] as const;
            })
          );
          const bySeg: Record<string, { value: string; label: string }[]> = {};
          gradesEntries.forEach(([segId, opts]) => {
            bySeg[segId] = opts;
          });
          if (!alive) return;
          setSegments(segmentOptions);
          setSeriesBySegment(bySeg);
        } catch {
          if (!alive) return;
          setSegments([]);
          setSeriesBySegment({});
        }
      })();
      return () => {
        alive = false;
      };
    }, []);

    function getAvailableSeriesBySelectedSegments(selectedSegments: unknown) {
        const segmentsArray: string[] = Array.isArray(selectedSegments)
            ? selectedSegments
            : typeof selectedSegments === "string" && selectedSegments.length
                ? selectedSegments.split(",").map(v => v.trim()).filter(Boolean)
                : [];
        return segmentsArray.flatMap(segmentKey => {
            const series = SERIES_BY_SEGMENT[segmentKey];
            return series ? series : [];
        });
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                segmentRef.current &&
                !segmentRef.current.contains(event.target as Node)
            ) {
                setIsSegmentOpen(false);
            }

            if (
                seriesRef.current &&
                !seriesRef.current.contains(event.target as Node)
            ) {
                setIsSeriesOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchCollegeData() {
            try {
                const collegeData = await findCollege(collegeId);
                setCollegeData({
                    ...collegeData,
                    internalManagement: Array.isArray(collegeData.internalManagement)
                        ? collegeData.internalManagement
                        : typeof collegeData.internalManagement === "string"
                            ? JSON.parse(collegeData.internalManagement)
                            : [],
                    contractSeries: normalizeContractSeries(collegeData.contractSeries)
                });
            } catch (error) {
                console.error("Error fetching college data:", error);
            }
        }

        async function fetchConsultants() {
            try {
                const consultantsData = await listConsultants();
                setConsultants(consultantsData);
            } catch (error) {
                console.error("Error fetching consultants:", error);
            }
        }

        fetchCollegeData()
        fetchOverviewData()
        fetchConsultants();
    }, []);

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                {isAdminPanel ? (
                    <AdminMenubar />
                ) : (
                    <ConsultantMenubar notificationCount={Number(overviewData?.unreadNotifications)} />
                )}
                 <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Visualizar escola</b>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => {
                                        const base = isAdminPanel ? "/admin" : "/consultant";
                                        window.location.href = `${base}/colleges/${collegeId}/final-report`;
                                    }}
                                >
                                    Ficha Escolar
                                </button>
                                <button onClick={() => {window.history.back()}}>Voltar</button>
                            </div>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Dados Cadastrais</b>
                            </div>

                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="collegeCode">Cód. Escola:*</label>
                                    <input type="text" id="collegeCode" name="collegeCode" value={collegeData.collegeCode || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="initDate">Data de Início:*</label>
                                    <input type="date" id="initDate" name="initDate" value={collegeData.initDate || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="name">Nome:*</label>
                                    <input type="text" id="name" name="name" value={collegeData.name || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="partner">Parceiro Contratante:*</label>
                                    <input type="text" id="partner" name="partner" value={collegeData.partner || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="address">Endereço:*</label>
                                    <input type="text" id="address" name="address" value={collegeData.address || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="addressNumber">Número:*</label>
                                    <input type="number" id="addressNumber" name="addressNumber" value={collegeData.addressNumber || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="state">Estado:*</label>
                                    <input type="text" id="state" name="state" value={collegeData.state || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="city">Município:*</label>
                                    <input type="text" id="city" name="city" value={collegeData.city || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="management">Regional/Gerência:*</label>
                                    <input type="text" id="management" name="management" value={collegeData.management || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="collegeSeries">Seguimento:*</label>
                                    <div className="custom-multiselect" ref={seriesRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsSeriesOpen(prev => !prev)}
                                        >
                                            {(() => {
                                                const seriesArray = normalizeContractSeries(collegeData.collegeSeries);
                                                return seriesArray.length
                                                    ? `${seriesArray.length} segmento(s) selecionado(s)`
                                                    : "Nenhum segmento selecionado";
                                            })()}
                                        </button>

                                        {isSeriesOpen && (
                                            <div className="multiselect-popup">
                                                {segments.map(segment => {
                                                    const currentSeries = normalizeContractSeries(collegeData.collegeSeries);
                                                    return (
                                                        <label key={segment.value} className="multiselect-option">
                                                            <input
                                                                type="checkbox"
                                                                checked={currentSeries.includes(segment.value)}
                                                                disabled
                                                            />
                                                            <span>{segment.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="contractSeries">Séries Contratadas:*</label>
                                    <div className="custom-multiselect" ref={segmentRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsSegmentOpen(prev => !prev)}
                                        >
                                            {(() => {
                                                const segmentsArray = normalizeContractSeries(collegeData.contractSeries);
                                                return segmentsArray.length
                                                    ? `${segmentsArray.length} série(s) selecionada(s)`
                                                    : "Nenhuma série selecionada";
                                            })()}
                                        </button>

                                        {isSegmentOpen && (
                                            <div className="multiselect-popup">
                                                {getAvailableSeriesBySelectedSegments(collegeData.collegeSeries).map(series => {
                                                    const currentSeries = normalizeContractSeries(collegeData.contractSeries);
                                                    return (
                                                        <label key={series.value} className="multiselect-option">
                                                            <input
                                                                type="checkbox"
                                                                checked={currentSeries.includes(series.value)}
                                                                disabled
                                                            />
                                                            <span>{series.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="salesManager">Comercial Responsável:*</label>
                                    <input type="text" id="salesManager" name="salesManager" value={collegeData.salesManager || ""} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="consultorId">Consultor Responsável:*</label>
                                    <select
                                        id="consultorId"
                                        name="consultorId"
                                        value={collegeData.consultorId || ""}
                                        disabled
                                    >
                                        <option value="" disabled>
                                            Nenhum consultor selecionado
                                        </option>
                                        {consultants.map((consultant: TConsultant) => (
                                            <option key={consultant.id} value={consultant.id}>
                                                {consultant.firstName} {consultant.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-wrapper">
                                    <label htmlFor="isActive">Status da Escola:*</label>
                                    <select id="isActive" name="isActive" value={collegeData.isActive ? "active" : "inactive"} disabled>
                                        <option value="active">Ativa</option>
                                        <option value="inactive">Inativa</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Equipe de Gestão</b>
                            </div>

                            <div className="form-table-container">
                                <table className="form-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Cargo</th>
                                            <th>Email</th>
                                            <th>Telefone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {  collegeData.internalManagement?.map((member, index) => (
                                        <tr key={index}>
                                            <td><span>{member.name}</span></td>
                                            <td><span>{member.role}</span></td>
                                            <td><span>{member.email}</span></td>
                                            <td><span>{member.phone}</span></td>
                                        </tr>
                                        )) || <tr><td colSpan={5}>Nenhum membro adicionado.</td></tr> }
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default ViewCollegeData;
