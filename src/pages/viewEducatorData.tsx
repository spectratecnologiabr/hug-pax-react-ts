import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { findUser } from "../controllers/user/findUser.controller";

import Menubar from "../components/consultant/menubar";

import "../style/adminDash.css";

type TUser = {
    id: number,
    firstName: string,
    lastName: string,
    birthDate: string,
    gender: string,
    profilePic: string,
    docType: string,
    docId: string,
    phone: string,
    email: string,
    language: string,
    courses: [],
    role: string,
    collegeId: number | null,
    isActive: boolean
}

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function ViewEducatorData() {
    const educatorId = useParams().educatorId as string;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ colleges, setColleges ] = useState<Array<{id: number, name: string}>>([]);
    const [ userData, setUserData ] = useState<TUser>({} as TUser);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchColleges() {
            try {
                const collegesList = await listColleges();
                setColleges(collegesList);
            } catch (error) {
                console.error("Error fetching colleges:", error);
            }
        }

        async function fetchUserData() {
            try {
                const userData = await findUser(educatorId);
                setUserData(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }
    
        fetchUserData();
        fetchColleges();
        fetchOverviewData();
    }, []);

    return (
        <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Visualizar educador</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Dados Cadastrais</b>
                            </div>

                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="firstName">Nome:</label>
                                    <input type="text" id="firstName" className="firstName" placeholder="Nome do educador" value={userData.firstName} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="lastName">Sobrenome:</label>
                                    <input type="text" id="lastName" className="lastName" placeholder="Sobrenome do educador" value={userData.lastName} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docType">Tipo de Documento:</label>
                                    <select id="docType" className="docType" value={userData.docType} disabled>
                                        <option value="">Selecionar</option>
                                        <option value="cpf">CPF</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docId">Número do Documento:</label>
                                    <input
                                        type="text"
                                        id="docId"
                                        className="docId"
                                        placeholder="Número do documento"
                                        value={userData.docId}
                                        disabled
                                        
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="birthDate">Data de Nascimento:</label>
                                    <input type="date" id="birthDate" className="birthDate" value={userData.birthDate} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="gender">Gênero:</label>
                                    <select id="gender" className="gender" value={userData.gender} disabled>
                                        <option value="male">Masculino</option>
                                        <option value="female">Feminino</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="phone">Telefone:</label>
                                    <input type="text" id="phone" className="phone" placeholder="(00) 00000-0000" value={userData.phone} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="email">Email:</label>
                                    <input type="text" id="email" className="email" placeholder="user@example.com" value={userData.email} disabled/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="language">Idioma:</label>
                                    <select id="language" className="language" value={userData.language} disabled>
                                        <option value="pt-BR">Português</option>
                                        <option value="es-ES">Espanhol</option>
                                        <option value="en-US">Inglês</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="collegeId">Escola:</label>
                                    <select id="collegeId" className="collegeId" value={userData.collegeId?.toString()} disabled>
                                        <option value="">Selecione uma escola</option>
                                        {colleges.map((college) => (
                                            <option key={college.id} value={college.id}>{college.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="isActive">Status:</label>
                                    <select
                                        id="isActive"
                                        className="isActive"
                                        value={
                                            userData.isActive !== undefined
                                            ? String(userData.isActive)
                                            : ""
                                        }
                                        disabled
                                        >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default ViewEducatorData