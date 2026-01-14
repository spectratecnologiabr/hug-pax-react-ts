import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { findUser } from "../controllers/user/findUser.controller";
import updateUser from "../controllers/user/updateUser.controller";

import Menubar from "../components/admin/menubar";

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

function EditEducatorPage() {
    const educatorId = useParams().educatorId as string;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ colleges, setColleges ] = useState<Array<{id: number, name: string}>>([]);
    const [ editUserData, setEditUserData ] = useState<TUser>({} as TUser);
    const [updateData, setUpdateData] = useState<TUser>({} as TUser);

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
                setEditUserData(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }
    
        fetchUserData();
        fetchColleges();
        fetchOverviewData();
    }, []);

    function formatDocId(docId: string, docType: string) {
        if (!docId) return "";

        const clean = docId.replace(/\W/g, "");

        if (docType === "cpf") {
            return clean
                .slice(0, 11)
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        }

        if (docType === "nif") {
            return clean
                .slice(0, 9)
                .replace(/^(\d{3})(\d)/, "$1 $2")
                .replace(/^(\d{3}) (\d{3})(\d)/, "$1 $2 $3");
        }

        if (docType === "passport") {
            return docId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        }

        return docId;
    }

    function setUpdatedData(event: React.ChangeEvent<any>) {
        const { id, value } = event.target;
        let newValue = value;

        if (id === "docId") {
            const currentType = updateData.docType || editUserData.docType || "cpf";
            newValue = formatDocId(value, currentType);
        }

        setUpdateData(prev => ({
            ...prev,
            [id]: newValue
        }));

        return;
    }

    async function sendEditUserRequest() {
        try {
            const updatedUserData = {
                ...updateData
            };
            await updateUser(Number(educatorId), updatedUserData);
            alert("Educador atualizado com sucesso!");
            setTimeout(() => {
                window.location.pathname = "/admin/educators";
            }, 500);
        } catch (error) {
            console.error("Error updating user data:", error);
            alert("Erro ao atualizar educador. Por favor, tente novamente.");
        }
    }

    return (
        <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Editar educador</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Dados Cadastrais</b>
                            </div>

                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="firstName">Nome:</label>
                                    <input type="text" id="firstName" className="firstName" placeholder="Nome do educador" value={updateData.firstName || editUserData.firstName} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="lastName">Sobrenome:</label>
                                    <input type="text" id="lastName" className="lastName" placeholder="Sobrenome do educador" value={updateData.lastName || editUserData.lastName} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docType">Tipo de Documento:</label>
                                    <select id="docType" className="docType" value={updateData.docType || editUserData.docType} onChange={setUpdatedData}>
                                        <option value="cpf">CPF</option>
                                        <option value="nif">NIF</option>
                                        <option value="passport">Passaporte</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docId">Número do Documento:</label>
                                    <input type="text" id="docId" className="docId" placeholder="Número do documento" value={updateData.docId || editUserData.docId} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="birthDate">Data de Nascimento:</label>
                                    <input type="date" id="birthDate" className="birthDate" value={updateData.birthDate || editUserData.birthDate} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="gender">Gênero:</label>
                                    <select id="gender" className="gender" value={updateData.gender || editUserData.gender} onChange={setUpdatedData}>
                                        <option value="male">Masculino</option>
                                        <option value="female">Feminino</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="phone">Telefone:</label>
                                    <input type="text" id="phone" className="phone" placeholder="(00) 00000-0000" value={updateData.phone || editUserData.phone} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="email">Email:</label>
                                    <input type="text" id="email" className="email" placeholder="user@example.com" value={updateData.email || editUserData.email} onChange={setUpdatedData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="language">Idioma:</label>
                                    <select id="language" className="language" value={updateData.language || editUserData.language} onChange={setUpdatedData}>
                                        <option value="pt-BR">Português</option>
                                        <option value="es-ES">Espanhol</option>
                                        <option value="en-US">Inglês</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="collegeId">Escola:</label>
                                    <select id="collegeId" className="collegeId" value={updateData.collegeId?.toString() || editUserData.collegeId?.toString()} onChange={setUpdatedData}>
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
                                            updateData.isActive !== undefined
                                            ? String(updateData.isActive)
                                            : editUserData.isActive !== undefined
                                            ? String(editUserData.isActive)
                                            : ""
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value === "true";
                                            setUpdateData(prev => ({ ...prev, isActive: value }));
                                        }}
                                        >
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="button-wrapper">
                            <button className="submit-button" onClick={sendEditUserRequest}>Salvar Educador</button>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default EditEducatorPage;