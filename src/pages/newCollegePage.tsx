import React, { useState, useEffect, useRef } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCollege, ICollegeProps } from "../controllers/college/createCollege.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";

import Menubar from "../components/consultant/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TInternalManager = {
    name: string,
    role: string,
    email: string,
    phone: string
}

function NewCollegePage() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ newCollegeData, setNewCollegeData ] = useState<ICollegeProps>({} as ICollegeProps);
    const [ newManagerData, setNewManagerData ] = useState<TInternalManager>({} as TInternalManager);

    const [isSegmentOpen, setIsSegmentOpen] = useState(false);
    const [isSeriesOpen, setIsSeriesOpen] = useState(false);

    const segmentRef = useRef<HTMLDivElement | null>(null);
    const seriesRef = useRef<HTMLDivElement | null>(null);

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

    const segments = [
        { value: "EDUCACAO_INFANTIL", label: "Educação Infantil" },
        { value: "ENSINO_FUNDAMENTAL_I", label: "Ensino Fundamental I" },
        { value: "ENSINO_FUNDAMENTAL_II", label: "Ensino Fundamental II" },
        { value: "ENSINO_MEDIO", label: "Ensino Médio" },
        { value: "EDUCACAO_PROFISSIONAL", label: "Educação Profissional" },
        { value: "EJA", label: "Educação de Jovens e Adultos" },
    ];

    const SERIES_BY_SEGMENT = {
        EDUCACAO_INFANTIL: [
            { value: "CRECHE_0_3", label: "Creche (0 a 3 anos)" },
            { value: "PRE_ESCOLA_4_5", label: "Pré-escola (4 a 5 anos)" },
        ],

        ENSINO_FUNDAMENTAL_I: [
            { value: "FUND_I_1", label: "1º ano" },
            { value: "FUND_I_2", label: "2º ano" },
            { value: "FUND_I_3", label: "3º ano" },
            { value: "FUND_I_4", label: "4º ano" },
            { value: "FUND_I_5", label: "5º ano" },
        ],

        ENSINO_FUNDAMENTAL_II: [
            { value: "FUND_II_6", label: "6º ano" },
            { value: "FUND_II_7", label: "7º ano" },
            { value: "FUND_II_8", label: "8º ano" },
            { value: "FUND_II_9", label: "9º ano" },
        ],

        ENSINO_MEDIO: [
            { value: "MEDIO_1", label: "1ª série" },
            { value: "MEDIO_2", label: "2ª série" },
            { value: "MEDIO_3", label: "3ª série" },
        ],

        EDUCACAO_PROFISSIONAL: [
            { value: "TECNICO_NIVEL_MEDIO", label: "Técnico de Nível Médio" },
            { value: "TECNOLOGO_SUPERIOR", label: "Tecnólogo (Nível Superior)" },
        ],

        EJA: [
            { value: "EJA_FUNDAMENTAL", label: "EJA Ensino Fundamental (1º ao 9º ano)" },
            { value: "EJA_MEDIO", label: "EJA Ensino Médio (1ª à 3ª série)" },
        ],
    }

    function getAvailableSeriesBySelectedSegments(selectedSegments: unknown) {
        const segmentsArray: string[] = Array.isArray(selectedSegments)
            ? selectedSegments
            : typeof selectedSegments === "string" && selectedSegments.length
                ? selectedSegments.split(",").map(v => v.trim()).filter(Boolean)
                : [];

        return segmentsArray.flatMap(segmentKey => {
            const series = SERIES_BY_SEGMENT[segmentKey as keyof typeof SERIES_BY_SEGMENT];
            return series ? series : [];
        });
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

        fetchOverviewData()
    }, []);

    const [consultants, setConsultants] = useState<{ id: number; firstName: string; lastName: string }[]>([]);

    useEffect(() => {
        async function fetchConsultants() {
            try {
                const data = await listConsultants();
                setConsultants(data);
            } catch (err) {
                console.error(err);
            }
        }
        fetchConsultants();
    }, []);

    function handleNewCollegeData(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const target = event.currentTarget;

        if (target.name === "collegeCode" || target.name === "consultorId" || target.name === "addressNumber") {
            setNewCollegeData(prev => ({
                ...prev,
                [target.name]: Number(target.value)
            }));
        } else {
            setNewCollegeData(prev => ({
                ...prev,
                [target.name]: target.value
            }));
        }
        
    }

    function handleNewManagerData(event: React.ChangeEvent<HTMLInputElement>) {
        const target = event.currentTarget;

        setNewManagerData(prev => ({
            ...prev,
            [target.name]: target.value
        }));
    }

    function addManagerToCollege() {
        setNewCollegeData(prev => ({
            ...prev,
            internalManagement: [
                ...(prev.internalManagement || []),
                newManagerData
            ]
        }));

        setNewManagerData({} as TInternalManager);
    }

    function toggleSegment(value: string) {
        const current: string[] = Array.isArray(newCollegeData.contractSeries)
            ? newCollegeData.contractSeries
            : [];

        const updated: string[] = current.includes(value)
            ? current.filter((v: string) => v !== value)
            : [...current, value];

        setNewCollegeData({
            ...newCollegeData,
            contractSeries: updated as unknown as string,
        });
    }

    async function sendCollegeData() {
        setNewCollegeData(prev => ({
            ...prev,
            collegeSeries: "",
            contractSeries: ""
        }));
        
        const response = await createCollege(newCollegeData);
        if (response.message === "College created") {
            alert("Informações gravadas com sucesso.")

            setTimeout(() => {
                window.location.href = "/consultant/colleges";
            }, 1000);
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Cadastrar nova escola</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Dados Cadastrais</b>
                            </div>

                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="collegeCode">Cód. Escola:*</label>
                                    <input type="text" id="collegeCode" name="collegeCode" onChange={handleNewCollegeData} maxLength={8} inputMode="numeric" pattern="[0-9]*" onKeyDown={(e) => { const allowedKeys = [  "Backspace", "Delete", "ArrowLeft",  "ArrowRight",  "Tab" ]; if (allowedKeys.includes(e.key)) return; if (!/^[0-9]$/.test(e.key)) { e.preventDefault(); } }}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="initDate">Data de Início:*</label>
                                    <input type="date" id="initDate" name="initDate" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="name">Nome:*</label>
                                    <input type="text" id="name" name="name" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="partner">Parceiro Contratante:*</label>
                                    <input type="text" id="partner" name="partner" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="address">Endereço:*</label>
                                    <input type="text" id="address" name="address" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="addressNumber">Número:*</label>
                                    <input type="number" id="addressNumber" name="addressNumber" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="state">Estado:*</label>
                                    <input type="text" id="state" name="state" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="city">Município:*</label>
                                    <input type="text" id="city" name="city" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="management">Regional/Gerência:*</label>
                                    <input type="text" id="management" name="management" onChange={handleNewCollegeData}/>
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
                                                const seriesArray = Array.isArray(newCollegeData.collegeSeries)
                                                    ? newCollegeData.collegeSeries
                                                    : typeof newCollegeData.collegeSeries === "string" && newCollegeData.collegeSeries.length
                                                        ? newCollegeData.collegeSeries.split(",")
                                                        : [];

                                                return seriesArray.length
                                                    ? `${seriesArray.length} segmento(s) selecionado(s)`
                                                    : "Selecionar segmentos";
                                            })()}
                                        </button>

                                        {isSeriesOpen && (
                                            <div className="multiselect-popup">
                                                {segments.map(segment => (
                                                    <label key={segment.value} className="multiselect-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                Array.isArray(newCollegeData.collegeSeries)
                                                                    ? newCollegeData.collegeSeries.includes(segment.value)
                                                                    : typeof newCollegeData.collegeSeries === "string"
                                                                        ? newCollegeData.collegeSeries.split(",").includes(segment.value)
                                                                        : false
                                                            }
                                                            onChange={() => {
                                                                const current: string[] = Array.isArray(newCollegeData.collegeSeries)
                                                                    ? newCollegeData.collegeSeries
                                                                    : typeof newCollegeData.collegeSeries === "string" && newCollegeData.collegeSeries.length
                                                                        ? newCollegeData.collegeSeries.split(",")
                                                                        : [];

                                                                const updated: string[] = current.includes(segment.value)
                                                                    ? current.filter((v: string) => v !== segment.value)
                                                                    : [...current, segment.value];

                                                                setNewCollegeData(prev => ({
                                                                    ...prev,
                                                                    collegeSeries: updated as unknown as string,
                                                                }));
                                                            }}
                                                        />
                                                        <span>{segment.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="contractSeries">Séries contratadas:*</label>
                                    <div className="custom-multiselect" ref={segmentRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsSegmentOpen(prev => !prev)}
                                        >
                                            {(() => {
                                                const segmentsArray = Array.isArray(newCollegeData.contractSeries)
                                                    ? newCollegeData.contractSeries
                                                    : typeof newCollegeData.contractSeries === "string" && newCollegeData.contractSeries.length
                                                        ? newCollegeData.contractSeries.split(",")
                                                        : [];

                                                return segmentsArray.length
                                                    ? `${segmentsArray.length} série(s) selecionada(s)`
                                                    : "Selecionar séries";
                                            })()}
                                        </button>

                                        {isSegmentOpen && (
                                            <div className="multiselect-popup">
                                                {getAvailableSeriesBySelectedSegments(newCollegeData.collegeSeries).map(series => (
                                                    <label key={series.value} className="multiselect-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                Array.isArray(newCollegeData.contractSeries)
                                                                    ? newCollegeData.contractSeries.includes(series.value)
                                                                    : typeof newCollegeData.contractSeries === "string"
                                                                        ? newCollegeData.contractSeries.split(",").includes(series.value)
                                                                        : false
                                                            }
                                                            onChange={() => toggleSegment(series.value)}
                                                        />
                                                        <span>{series.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="salesManager">Comercial Responsável:*</label>
                                    <input type="text" id="salesManager" name="salesManager" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="consultorId">Consultor Responsável:*</label>
                                    <select id="consultorId" name="consultorId" onChange={handleNewCollegeData} defaultValue="">
                                        <option value="" disabled>Selecione um consultor</option>
                                        {consultants.map(consultant => (
                                            <option key={consultant.id} value={consultant.id}>
                                                {consultant.firstName} {consultant.lastName}
                                            </option>
                                        ))}
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
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {  newCollegeData.internalManagement?.map((member, index) => (
                                        <tr key={index}>
                                            <td><span>{member.name}</span></td>
                                            <td><span>{member.role}</span></td>
                                            <td><span>{member.email}</span></td>
                                            <td><span>{member.phone}</span></td>
                                            <td className="buttons-cell">
                                                <button className="delete-button">
                                                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V6C13 4.9 12.1 4 11 4H3C1.9 4 1 4.9 1 6V16ZM10.5 1L9.79 0.29C9.61 0.11 9.35 0 9.09 0H4.91C4.65 0 4.39 0.11 4.21 0.29L3.5 1H1C0.45 1 0 1.45 0 2C0 2.55 0.45 3 1 3H13C13.55 3 14 2.55 14 2C14 1.45 13.55 1 13 1H10.5Z" fill="#F04F4F"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        )) || <tr><td colSpan={5}>Nenhum membro adicionado.</td></tr> }
                                    </tbody>
                                </table>
                                <div className="form-grid">
                                    <div className="input-wrapper">
                                        <label htmlFor="name">Nome:*</label>
                                        <input type="text" id="name" name="name" value={newManagerData.name || ""} onChange={handleNewManagerData}/>
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="role">Cargo:*</label>
                                        <input type="text" id="role" name="role" value={newManagerData.role || ""} onChange={handleNewManagerData} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="email">Email:*</label>
                                        <input type="text" id="email" name="email" value={newManagerData.email || ""} onChange={handleNewManagerData} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="phone">Telefone:*</label>
                                        <input type="text" id="phone" name="phone" value={newManagerData.phone || ""} onChange={handleNewManagerData} />
                                    </div>
                                </div>
                                <div className="button-wrapper">
                                    <button className="submit-button" onClick={addManagerToCollege}>Adicionar membro</button>
                                </div>
                            </div>
                        </div>


                        <div className="button-wrapper">
                            <button className="submit-button" onClick={sendCollegeData}>Salvar informações</button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default NewCollegePage