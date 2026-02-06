import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { findUser } from "../controllers/user/findUser.controller";
import updateUser from "../controllers/user/updateUser.controller";

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

function EditEducatorPage() {
    const educatorId = useParams().educatorId as string;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ colleges, setColleges ] = useState<Array<{id: number, name: string}>>([]);
    const [ editUserData, setEditUserData ] = useState<TUser>({} as TUser);
    const [updateData, setUpdateData] = useState<TUser>({} as TUser);
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");

    function handleModalMessage(data: { isError: boolean; message: string }) {
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(data.isError);
        if (messageElement) {
            messageElement.textContent = data.message;
        } else {
            setMessage(data.message);
        }
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
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
            handleModalMessage({
                isError: false,
                message: "Educador atualizado com sucesso!"
            });
            setTimeout(() => {
                window.location.pathname = "/admin/educators";
            }, 500);
        } catch (error) {
            console.error("Error updating user data:", error);
            handleModalMessage({
                isError: true,
                message: "Erro ao atualizar educador. Por favor, tente novamente."
            });
        }
    }

    return (
        <React.Fragment>
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
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="Número do documento"
                                        value={updateData.docId || editUserData.docId}
                                        onKeyDown={(e) => {
                                            const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                                            if (allowedKeys.includes(e.key)) return;
                                            if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                                        }}
                                        onChange={setUpdatedData}
                                    />
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
            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    );
}

export default EditEducatorPage;