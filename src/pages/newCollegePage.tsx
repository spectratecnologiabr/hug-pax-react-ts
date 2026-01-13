import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCollege, ICollegeProps } from "../controllers/college/createCollege.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function NewCollegePage() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ newCollegeData, setNewCollegeData ] = useState<ICollegeProps>({} as ICollegeProps);
    const [ created, setCreated ] = useState(false);
    const [ createdCollegeId, setCreatedCollegeId ] = useState<number | null>(null);

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

    function handleNewCollegeData(event: React.ChangeEvent<HTMLInputElement>) {
        const target = event.currentTarget;

        setNewCollegeData(prev => ({
            ...prev,
            [target.name]: target.value
        }));
    }

    async function sendCollegeData() {
        setNewCollegeData(prev => ({
            ...prev,
            collegeSeries: [],
            contractSeries: []
        }));
        
        const response = await createCollege(newCollegeData);
        if (response.message === "College created") {
            setCreated(true);
            alert("Informações gravadas com sucesso.")
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
                                    <label htmlFor="collegeSeries">Séries da Escola:*</label>
                                    <input type="text" id="collegeSeries" name="collegeSeries" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="contractSeries">Séries Contratadas:*</label>
                                    <input type="text" id="contractSeries" name="contractSeries" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="salesManager">Comercial Responsável:*</label>
                                    <input type="text" id="salesManager" name="salesManager" onChange={handleNewCollegeData}/>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="coordinator">Coordenador Responsável:*</label>
                                    <input type="text" id="coordinator" name="coordinator" onChange={handleNewCollegeData}/>
                                </div>
                            </div>
                            <div className="button-wrapper">
                                <button className="submit-button" onClick={sendCollegeData}>Salvar informações</button>
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
                                        <tr>
                                            <td><span>João da Silva</span></td>
                                            <td><span>Coordenador</span></td>
                                            <td><span>joao.silva@escola.com</span></td>
                                            <td><span>(11) 99999-9999</span></td>
                                            <td className="buttons-cell">
                                                <button className="delete-button">
                                                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V6C13 4.9 12.1 4 11 4H3C1.9 4 1 4.9 1 6V16ZM10.5 1L9.79 0.29C9.61 0.11 9.35 0 9.09 0H4.91C4.65 0 4.39 0.11 4.21 0.29L3.5 1H1C0.45 1 0 1.45 0 2C0 2.55 0.45 3 1 3H13C13.55 3 14 2.55 14 2C14 1.45 13.55 1 13 1H10.5Z" fill="#F04F4F"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="form-grid">
                                    <div className="input-wrapper">
                                        <label htmlFor="managerName">Nome:*</label>
                                        <input type="text" id="managerName" name="managerName" disabled={!created} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="managerRole">Cargo:*</label>
                                        <input type="text" id="managerRole" name="managerRole" disabled={!created} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="managerEmail">Email:*</label>
                                        <input type="text" id="managerEmail" name="managerEmail" disabled={!created} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="managerPhone">Telefone:*</label>
                                        <input type="text" id="managerPhone" name="managerPhone" disabled={!created} />
                                    </div>
                                </div>
                                <div className="button-wrapper">
                                    <button className="submit-button">Adicionar membro</button>
                                </div>
                            </div>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Visitas</b>
                            </div>

                            <div className="form-table-container">
                                <table className="form-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Fotos</th>
                                            <th>Observações</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span>23/12/2025</span></td>
                                            <td><span><a href="#">Foto 1</a>, <a href="#">Foto 2</a></span></td>
                                            <td><button className="download-button">Baixar</button></td>
                                            <td className="buttons-cell">
                                                <button className="delete-button">
                                                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V6C13 4.9 12.1 4 11 4H3C1.9 4 1 4.9 1 6V16ZM10.5 1L9.79 0.29C9.61 0.11 9.35 0 9.09 0H4.91C4.65 0 4.39 0.11 4.21 0.29L3.5 1H1C0.45 1 0 1.45 0 2C0 2.55 0.45 3 1 3H13C13.55 3 14 2.55 14 2C14 1.45 13.55 1 13 1H10.5Z" fill="#F04F4F"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="form-grid">
                                    <div className="input-wrapper">
                                        <label htmlFor="visitDate">Data da Visita:*</label>
                                        <input type="date" id="visitDate" name="visitDate" disabled={!created}/>
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="visitPhotos">Fotos:</label>
                                        <input type="file" id="visitPhotos" name="visitPhotos" multiple disabled={!created}/>
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="visitNotes">Observações:*</label>
                                        <input type="file" name="visitNotes" id="visitNotes" disabled={!created} />
                                        <small>Importe suas observações preenchendo um documento word ou bloco de notas</small>
                                    </div>
                                </div>
                                <div className="button-wrapper">
                                    <button className="submit-button" disabled={!created}>Adicionar visita</button>
                                </div>
                            </div>
                        </div>

                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Relatórios</b>
                            </div>

                            <div className="form-table-container">
                                <table className="form-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Fotos</th>
                                            <th>Documento</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span>23/12/2025</span></td>
                                            <td><span><a href="#">Foto 1</a>, <a href="#">Foto 2</a></span></td>
                                            <td><button className="download-button">Baixar</button></td>
                                            <td className="buttons-cell">
                                                <button className="delete-button">
                                                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 16C1 17.1 1.9 18 3 18H11C12.1 18 13 17.1 13 16V6C13 4.9 12.1 4 11 4H3C1.9 4 1 4.9 1 6V16ZM10.5 1L9.79 0.29C9.61 0.11 9.35 0 9.09 0H4.91C4.65 0 4.39 0.11 4.21 0.29L3.5 1H1C0.45 1 0 1.45 0 2C0 2.55 0.45 3 1 3H13C13.55 3 14 2.55 14 2C14 1.45 13.55 1 13 1H10.5Z" fill="#F04F4F"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="form-grid">
                                    <div className="input-wrapper">
                                        <label htmlFor="visitDate">Data:*</label>
                                        <input type="date" id="visitDate" name="visitDate" disabled={!created} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="visitPhotos">Fotos:</label>
                                        <input type="file" id="visitPhotos" name="visitPhotos" multiple disabled={!created} />
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="visitNotes">Documento:*</label>
                                        <input type="file" name="visitNotes" id="visitNotes" disabled={!created} />
                                        <small>Importe seu relatório preenchendo um documento word ou bloco de notas</small>
                                    </div>
                                </div>
                                <div className="button-wrapper">
                                    <button className="submit-button"disabled={!created}>Adicionar relatório</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default NewCollegePage