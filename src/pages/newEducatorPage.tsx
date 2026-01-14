import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { createUser, ICreateUserData } from "../controllers/user/createUser.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function NewEducatorPage() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ colleges, setColleges ] = useState<Array<{id: number, name: string}>>([]);
    const [ createUserData, setCreateUserData ] = useState<ICreateUserData>({
        firstName: "",
        lastName: "",
        email: "",
        password: "Temp@123",
        role: "educator",
        docType: "",
        docId: "",
        birthDate: "",
        gender: "",
        phone: "",
        language: "",
        collegeId: null
    } as ICreateUserData);

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

        fetchColleges();
        fetchOverviewData();
    }, []);

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { id, value } = event.target;
        setCreateUserData((prevData) => ({
            ...prevData,
            [id]: value
        }));
    }

    async function sendCreateUserRequest() {
        console.log("Creating user with data:", createUserData);
        try {
            const response = await createUser(createUserData);
            alert("Educador criado com sucesso!");
            console.log("User created successfully:", response);
            setTimeout(() => {window.location.href = "/admin/educators";}, 1000);
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Erro ao criar educador. Verifique os dados e tente novamente.");
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Cadastrar novo educador</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Dados Cadastrais</b>
                            </div>

                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="firstName">Nome:</label>
                                    <input type="text" id="firstName" className="firstName" placeholder="Nome do educador" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="lastName">Sobrenome:</label>
                                    <input type="text" id="lastName" className="lastName" placeholder="Sobrenome do educador" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docType">Tipo de Documento:</label>
                                    <select id="docType" className="docType" onChange={handleInputChange}>
                                        <option value="cpf">CPF</option>
                                        <option value="nif">NIF</option>
                                        <option value="passport">Passaporte</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="docNumber">Número do Documento:</label>
                                    <input type="text" id="docNumber" className="docNumber" placeholder="Número do documento" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="birthDate">Data de Nascimento:</label>
                                    <input type="date" id="birthDate" className="birthDate" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="gender">Gênero:</label>
                                    <select id="gender" className="gender" onChange={handleInputChange}>
                                        <option value="male">Masculino</option>
                                        <option value="female">Feminino</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="phone">Telefone:</label>
                                    <input type="text" id="phone" className="phone" placeholder="(00) 00000-0000" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="email">Email:</label>
                                    <input type="text" id="email" className="email" placeholder="user@example.com" onChange={handleInputChange}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="language">Idioma:</label>
                                    <select id="language" className="language">
                                        <option value="pt-BR">Português</option>
                                        <option value="es-ES">Espanhol</option>
                                        <option value="en-US">Inglês</option>
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="collegeId">Escola:</label>
                                    <select id="collegeId" className="collegeId" onChange={handleInputChange}>
                                        <option value="">Selecione uma escola</option>
                                        {colleges.map((college) => (
                                            <option key={college.id} value={college.id}>{college.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="button-wrapper">
                            <button className="submit-button" onClick={sendCreateUserRequest}>Salvar Educador</button>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default NewEducatorPage;