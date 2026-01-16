import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function VisitFormAnswers() {
    const visitId = useParams().visitId;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);

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

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper big">
                            <b>Formulário de Visita de Consultoria Pedagógica</b>
                        </div>
                        <div className="form-wrapper">
                            <div className="form-grid list">
                                {/* Painel Logístico e Administrativo */}
                                <div className="sub-title-wrapper"><b>Painel Logístico e Administrativo</b></div>

                                <div className="input-wrapper">
                                    <label>Todos os educadores cadastrados na PAX antes da visita?</label>
                                    <label><input type="radio" name="educatorsRegistered" value="yes" /> Sim</label>
                                    <label><input type="radio" name="educatorsRegistered" value="no" /> Não</label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Se não, motivo:</label>
                                    <select name="educatorsReason">
                                        <option value="">Selecione</option>
                                        <option value="system_error">Erro sistema</option>
                                        <option value="new_educator">Educador novo</option>
                                        <option value="management_issue">Gestão não enviou</option>
                                    </select>
                                </div>

                                <div className="input-wrapper">
                                    <label>Todos possuem livros?</label>
                                    <label><input type="radio" name="booksAvailable" value="yes" /> Sim</label>
                                    <label><input type="radio" name="booksAvailable" value="no" /> Não</label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Se não, quantos faltam?</label>
                                    <input type="number" name="missingBooks" min={0} />
                                </div>

                                <div className="input-wrapper">
                                    <label>Justificativa da falta:</label>
                                    <input type="text" name="missingBooksReason" maxLength={255} />
                                </div>

                                <div className="input-wrapper">
                                    <label>Status atual da coleta de dados:</label>
                                    <select name="dataCollectionStatus">
                                        <option value="not_started">Não iniciado</option>
                                        <option value="initial">Fase inicial</option>
                                        <option value="collecting">Em coleta</option>
                                        <option value="finished">Finalizado</option>
                                    </select>
                                </div>

                                <div className="sub-title-wrapper"><b>Radar de Evolução</b></div>

                                {["engagement", "teacherDomain", "managementSupport"].map((item) => (
                                    <div className="input-wrapper" key={item}>
                                        <label>{item === "engagement" ? "Engajamento dos Alunos" : item === "teacherDomain" ? "Domínio do Professor" : "Apoio da Gestão"}</label>
                                        <label><input type="radio" name={item} value="regressed" /> Regrediu</label>
                                        <label><input type="radio" name={item} value="stable" /> Estável</label>
                                        <label><input type="radio" name={item} value="evolved" /> Evoluiu</label>
                                    </div>
                                ))}

                                <div className="sub-title-wrapper"><b>Evidência de Prática Observada</b></div>

                                {[
                                    "Uso de vocabulário socioemocional",
                                    "Mural ou produções visuais",
                                    "Mediação de conflitos",
                                    "Adaptação de dinâmicas",
                                    "Nenhuma evidência além do uso protocolar"
                                ].map((label, index) => (
                                    <div className="input-wrapper" key={index}>
                                        <label>
                                            <input type="checkbox" name="practiceEvidence" value={label} /> {label}
                                        </label>
                                    </div>
                                ))}

                                {/* Voz da Gestão */}
                                <div className="sub-title-wrapper"><b>Voz da Gestão</b></div>

                                <div className="input-wrapper">
                                    <label>Maior desafio para engajar professores (Ano 1):</label>
                                    <input type="text" name="managementChallenge" />
                                </div>

                                <div className="input-wrapper">
                                    <label>O suporte atende às expectativas? (1 a 5)</label>
                                    <input type="number" name="supportRating" min={1} max={5} />
                                </div>

                                <div className="input-wrapper">
                                    <label>Impacto mais visível hoje (Ano 2+):</label>
                                    <input type="text" name="visibleImpact" />
                                </div>

                                <div className="input-wrapper">
                                    <label>Interesse em expandir o programa?</label>
                                    <label><input type="radio" name="expandInterest" value="yes" /> Sim</label>
                                    <label><input type="radio" name="expandInterest" value="no" /> Não</label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Feedback geral da gestão:</label>
                                    <textarea name="generalFeedback" rows={4}></textarea>
                                </div>

                                {/* Resumo e Plano de Ação */}
                                <div className="sub-title-wrapper"><b>Resumo e Plano de Ação</b></div>

                                <div className="input-wrapper">
                                    <label>Resumo da Visita:</label>
                                    <textarea name="visitSummary" rows={4}></textarea>
                                </div>

                                <div className="input-wrapper">
                                    <label>Destaques principais:</label>
                                    <textarea name="keyInsights" rows={3}></textarea>
                                </div>

                                <div className="input-wrapper">
                                    <label>Acordo para a próxima visita:</label>
                                    <input type="text" name="nextVisitAgreement" />
                                </div>

                                <div className="input-wrapper">
                                    <label>Meta anterior cumprida?</label>
                                    <label><input type="radio" name="previousGoalMet" value="yes" /> Sim</label>
                                    <label><input type="radio" name="previousGoalMet" value="no" /> Não</label>
                                    <label><input type="radio" name="previousGoalMet" value="partial" /> Parcialmente</label>
                                </div>

                                {/* Ação Extra */}
                                <div className="sub-title-wrapper"><b>Ação Extra</b></div>

                                <div className="input-wrapper">
                                    <label>Houve ação extra?</label>
                                    <label><input type="radio" name="extraAction" value="yes" /> Sim</label>
                                    <label><input type="radio" name="extraAction" value="no" /> Não</label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Qual ação, público e quantidade?</label>
                                    <input type="text" name="extraActionDetails" />
                                </div>

                                <div className="input-wrapper">
                                    <label>Receptividade do público:</label>
                                    <label><input type="radio" name="audienceReception" value="low" /> Baixa</label>
                                    <label><input type="radio" name="audienceReception" value="medium" /> Média</label>
                                    <label><input type="radio" name="audienceReception" value="high" /> Alta</label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Principais destaques da ação:</label>
                                    <textarea name="extraHighlights" rows={3}></textarea>
                                </div>

                                {/* Registros Fotográficos */}
                                <div className="sub-title-wrapper"><b>Registros Fotográficos</b></div>

                                <div className="input-wrapper">
                                    <label>Foto 01:</label>
                                    <input type="file" name="photo1" accept="image/*" />
                                    <input type="text" name="photo1Caption" placeholder="Legenda / descrição" />
                                </div>

                                <div className="input-wrapper">
                                    <label>Foto 02:</label>
                                    <input type="file" name="photo2" accept="image/*" />
                                    <input type="text" name="photo2Caption" placeholder="Legenda / descrição" />
                                </div>

                                <div className="input-wrapper">
                                    <label htmlFor="observations">Notas adicionais:</label>
                                    <textarea name="observations" id="observations" rows={10}></textarea>
                                </div>

                            </div>
                            <div className="button-wrapper">
                            <button className="submit-button">Finalizar visita</button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default VisitFormAnswers;