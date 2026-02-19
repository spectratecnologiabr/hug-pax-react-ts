import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { findVisit } from "../controllers/consultant/findVisit.controller";
import { updateVisit } from "../controllers/consultant/updateVisit.controller";
import { createVisitPhotoFile } from "../controllers/consultant/createVisitPhotoFile.controller";

import Menubar from "../components/consultant/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TVisitData = {
    id: number,
	collegeId: number,
	creatorId: number,
	institutionProfile: string,
	visitType: string,
	collegeName: string,
	collegeAddress: string,
	collegeNumber: number,
	city: string,
	manager: string,
	visitDate: string,
	lastVisitDate: string,
	lastReschedulingReason: string,
	reschedulingAmount: number,
	cancelReason: string,
	guestConsultants: any[],
	initRouteTime: string,
	initRouteCoordinates: any,
	endRouteTime: string,
	endRouteCoordinates: any,
	initVisitTime: string,
	endVisitTime: string,
	visitObservations: string,
	schedulingObservations: string,
	formAnswers: any[],
	photos: any[],
	status: string,
	createdAt: string,
	updatedAt: string
}

function VisitFormAnswers() {
    const visitId = useParams().visitId;
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ visitData, setVisitData ] = useState<TVisitData | null>(null);
    const [ formAnswers, setFormAnswers ] = useState<any[]>(visitData?.formAnswers ?? []);
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [uploadingByField, setUploadingByField] = useState<Record<string, boolean>>({});

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

        async function fetchVisitData() {
            try {
                const visitDataFetch = await findVisit(Number(visitId));
                setVisitData(visitDataFetch)
                setFormAnswers(visitDataFetch.formAnswers ?? []);
            } catch (error) {
                console.error("Error fetching visit data:", error);
            }
        }

        fetchVisitData();
        fetchOverviewData();
    }, []);

    function getAnswer(name: string) {
      const found = formAnswers.find((item) => item.name === name);
      return found?.value ?? (Array.isArray(found?.value) ? [] : "");
    }

    function handleChange(
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
      const target = event.target;
      const { name } = target;
      if (!name) return;

      let value: any = target.value;

      setFormAnswers((prev) => {
        const existing = prev.find((item) => item.name === name);

        // ✅ CHECKBOX (multi)
        if (target instanceof HTMLInputElement && target.type === "checkbox") {
          const prevValues = Array.isArray(existing?.value)
            ? existing.value
            : [];

          const newValues = target.checked
            ? [...prevValues, value]
            : prevValues.filter((v: string) => v !== value);

          if (existing) {
            return prev.map((item) =>
              item.name === name ? { ...item, value: newValues } : item
            );
          }

          return [...prev, { name, value: newValues }];
        }

        // ✅ RADIO
        if (target instanceof HTMLInputElement && target.type === "radio") {
          if (!target.checked) return prev;
        }

        // ✅ DEFAULT (input, select, textarea)
        if (existing) {
          return prev.map((item) =>
            item.name === name ? { ...item, value } : item
          );
        }

        return [...prev, { name, value }];
      });
    }

    async function sendFormAnswers(
      event: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
      const { name } = event.target;
      if (!name || !visitData?.id) return;

      const answer = formAnswers.find((item) => item.name === name);
      if (!answer) return;

      try {
        await updateVisit(visitData.id, {
          formAnswers: formAnswers
        });
      } catch (error) {
        console.error("Erro ao salvar campo:", error);
      }
    }

    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
      const { name, files } = event.target;
      if (!name || !files?.length || !visitData?.id) return;

      const file = files[0];
      setUploadingByField((prev) => ({ ...prev, [name]: true }));

      try {
        const createdFile = await createVisitPhotoFile({
          file,
          name: file.name
        });
        const fileKey = createdFile?.fileKey || "";

        if (!fileKey) {
          throw new Error("Não foi possível obter a chave do arquivo enviado.");
        }

        const nextAnswers = (() => {
          const existing = formAnswers.find((item) => item.name === name);
          if (existing) {
            return formAnswers.map((item) =>
              item.name === name ? { ...item, value: String(fileKey) } : item
            );
          }
          return [...formAnswers, { name, value: String(fileKey) }];
        })();

        setFormAnswers(nextAnswers);
        await updateVisit(visitData.id, { formAnswers: nextAnswers });
      } catch (error) {
        console.error("Erro ao enviar arquivo:", error);
        handleModalMessage({
          isError: true,
          message: "Erro ao enviar arquivo para o CDN. Tente novamente.",
        });
      } finally {
        setUploadingByField((prev) => ({ ...prev, [name]: false }));
        event.target.value = "";
      }
    }

    // Helper function to validate required fields before finalizing visit
    function validateForm() {
        const requiredFields = [
            "educatorsRegistered",
            "booksAvailable",
            "dataCollectionStatus",
            "supportRating",
            "generalFeedback",
            "visitSummary"
        ];

        const missing = requiredFields.filter(
            (field) =>
                !formAnswers.find(
                    (item) =>
                        item.name === field &&
                        item.value !== "" &&
                        item.value !== null &&
                        item.value !== undefined
                )
        );

        return {
            isValid: missing.length === 0,
            missing
        };
    }

    // Submit handler for finalizing the visit
    async function handleFinalizeVisit() {
        if (!visitData?.id) return;

        const { isValid, missing } = validateForm();

        if (!isValid) {
            handleModalMessage({
                isError: true,
                message:
                    "Preencha todos os campos obrigatórios antes de finalizar.\n\nCampos pendentes:\n- " +
                    missing.join("\n- ")
            });
            return;
        }

        try {
            await updateVisit(visitData.id, {
                formAnswers,
                status: "completed"
            });

            handleModalMessage({ isError: false, message: "Visita finalizada com sucesso!" });
        } catch (error) {
            console.error("Erro ao finalizar visita:", error);
            handleModalMessage({ isError: true, message: "Erro ao finalizar a visita. Tente novamente." });
        }
    }

    // --- helpers for visit type/profile ---
    const isFirstVisit = visitData?.visitType === "Visita Inicial";
    const isAno1 = visitData?.institutionProfile === "Implantação";
    const isAno2Plus = visitData?.institutionProfile === "Veterana";

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
                                    <label>
                                        <input
                                            type="radio"
                                            name="educatorsRegistered"
                                            value="yes"
                                            checked={getAnswer("educatorsRegistered") === "yes"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Sim
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="educatorsRegistered"
                                            value="no"
                                            checked={getAnswer("educatorsRegistered") === "no"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Não
                                    </label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Se não, motivo:</label>
                                    <select
                                        name="educatorsReason"
                                        value={getAnswer("educatorsReason")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="system_error">Erro sistema</option>
                                        <option value="new_educator">Educador novo</option>
                                        <option value="management_issue">Gestão não enviou</option>
                                    </select>
                                </div>
                                {getAnswer("educatorsRegistered") === "no" && (
                                    <div className="input-wrapper">
                                        <label>Quais educadores não possuem acesso? (nomes ou perfis)</label>
                                        <textarea
                                            name="educatorsWithoutAccess"
                                            rows={3}
                                            value={getAnswer("educatorsWithoutAccess")}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        />
                                    </div>
                                )}

                                <div className="input-wrapper">
                                    <label>Todos possuem livros?</label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="booksAvailable"
                                            value="yes"
                                            checked={getAnswer("booksAvailable") === "yes"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Sim
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="booksAvailable"
                                            value="no"
                                            checked={getAnswer("booksAvailable") === "no"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Não
                                    </label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Se não, quantos faltam?</label>
                                    <input
                                        type="number"
                                        name="missingBooks"
                                        min={0}
                                        value={getAnswer("missingBooks")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label>Justificativa da falta:</label>
                                    <input
                                        type="text"
                                        name="missingBooksReason"
                                        maxLength={255}
                                        value={getAnswer("missingBooksReason")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label>Status atual da coleta de dados:</label>
                                    <select
                                        name="dataCollectionStatus"
                                        value={getAnswer("dataCollectionStatus")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    >
                                        <option value="not_started">Não iniciado</option>
                                        <option value="initial">Fase inicial</option>
                                        <option value="collecting">Em coleta</option>
                                        <option value="finished">Finalizado</option>
                                    </select>
                                </div>

                                {/* Radar de Evolução – somente se NÃO for primeira visita */}
                                {!isFirstVisit && (
                                    <>
                                        <div className="sub-title-wrapper"><b>Radar de Evolução</b></div>

                                        {["engagement", "teacherDomain", "managementSupport"].map((item) => (
                                            <div className="input-wrapper" key={item}>
                                                <label>{item === "engagement" ? "Engajamento dos Alunos" : item === "teacherDomain" ? "Domínio do Professor" : "Apoio da Gestão"}</label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={item}
                                                        value="regressed"
                                                        checked={getAnswer(item) === "regressed"}
                                                        onChange={handleChange}
                                                        onBlur={sendFormAnswers}
                                                    /> Regrediu
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={item}
                                                        value="stable"
                                                        checked={getAnswer(item) === "stable"}
                                                        onChange={handleChange}
                                                        onBlur={sendFormAnswers}
                                                    /> Estável
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={item}
                                                        value="evolved"
                                                        checked={getAnswer(item) === "evolved"}
                                                        onChange={handleChange}
                                                        onBlur={sendFormAnswers}
                                                    /> Evoluiu
                                                </label>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Evidência de Prática Observada – somente se NÃO for primeira visita */}
                                {!isFirstVisit && (
                                    <>
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
                                                    <input
                                                        type="checkbox"
                                                        name="practiceEvidence"
                                                        value={label}
                                                        checked={
                                                          Array.isArray(getAnswer("practiceEvidence")) &&
                                                          getAnswer("practiceEvidence").includes(label)
                                                        }
                                                        onChange={handleChange}
                                                        onBlur={sendFormAnswers}
                                                    /> {label}
                                                </label>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Voz da Gestão */}
                                <div className="sub-title-wrapper"><b>Voz da Gestão</b></div>

                                {isAno1 && (
                                    <>
                                        <div className="input-wrapper">
                                            <label>Maior desafio para engajar professores (Ano 1):</label>
                                            <input
                                                type="text"
                                                name="managementChallenge"
                                                value={getAnswer("managementChallenge")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="input-wrapper">
                                    <label>O suporte atende às expectativas? (1 a 5)</label>
                                    <input
                                        type="number"
                                        name="supportRating"
                                        min={1}
                                        max={5}
                                        value={getAnswer("supportRating")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                {isAno2Plus && (
                                    <>
                                        <div className="input-wrapper">
                                            <label>Impacto mais visível hoje (Ano 2+):</label>
                                            <input
                                                type="text"
                                                name="visibleImpact"
                                                value={getAnswer("visibleImpact")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label>Interesse em expandir o programa?</label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="expandInterest"
                                                    value="yes"
                                                    checked={getAnswer("expandInterest") === "yes"}
                                                    onChange={handleChange}
                                                    onBlur={sendFormAnswers}
                                                /> Sim
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="expandInterest"
                                                    value="no"
                                                    checked={getAnswer("expandInterest") === "no"}
                                                    onChange={handleChange}
                                                    onBlur={sendFormAnswers}
                                                /> Não
                                            </label>
                                        </div>
                                    </>
                                )}

                                <div className="input-wrapper">
                                    <label>Feedback geral da gestão:</label>
                                    <textarea
                                        name="generalFeedback"
                                        rows={4}
                                        value={getAnswer("generalFeedback")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                {/* Resumo e Plano de Ação */}
                                <div className="sub-title-wrapper"><b>Resumo e Plano de Ação</b></div>

                                <div className="input-wrapper">
                                    <label>Resumo da Visita:</label>
                                    <textarea
                                        name="visitSummary"
                                        rows={4}
                                        value={getAnswer("visitSummary")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label>Destaques principais:</label>
                                    <textarea
                                        name="keyInsights"
                                        rows={3}
                                        value={getAnswer("keyInsights")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label>Acordo para a próxima visita:</label>
                                    <input
                                        type="text"
                                        name="nextVisitAgreement"
                                        value={getAnswer("nextVisitAgreement")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                {/* Meta anterior cumprida – apenas se NÃO for primeira visita */}
                                {!isFirstVisit && (
                                    <div className="input-wrapper">
                                        <label>Meta anterior cumprida?</label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="previousGoalMet"
                                                value="yes"
                                                checked={getAnswer("previousGoalMet") === "yes"}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            /> Sim
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="previousGoalMet"
                                                value="no"
                                                checked={getAnswer("previousGoalMet") === "no"}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            /> Não
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="previousGoalMet"
                                                value="partial"
                                                checked={getAnswer("previousGoalMet") === "partial"}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            /> Parcialmente
                                        </label>
                                    </div>
                                )}

                                {/* Ação Extra */}
                                <div className="sub-title-wrapper"><b>Ação Extra</b></div>

                                <div className="input-wrapper">
                                    <label>Houve ação extra?</label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="extraAction"
                                            value="yes"
                                            checked={getAnswer("extraAction") === "yes"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Sim
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="extraAction"
                                            value="no"
                                            checked={getAnswer("extraAction") === "no"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Não
                                    </label>
                                </div>
                                {getAnswer("extraAction") === "yes" && (
                                    <>
                                        <div className="input-wrapper">
                                            <label>Data da ação extra:</label>
                                            <input
                                                type="date"
                                                name="extraActionDate"
                                                value={getAnswer("extraActionDate")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label>Qual foi a ação realizada?</label>
                                            <input
                                                type="text"
                                                name="extraActionName"
                                                value={getAnswer("extraActionName")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label>Público atendido:</label>
                                            <input
                                                type="text"
                                                name="extraActionAudience"
                                                value={getAnswer("extraActionAudience")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label>Quantidade de participantes:</label>
                                            <input
                                                type="number"
                                                name="extraActionAmount"
                                                min={0}
                                                value={getAnswer("extraActionAmount")}
                                                onChange={handleChange}
                                                onBlur={sendFormAnswers}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="input-wrapper">
                                    <label>Receptividade do público:</label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="audienceReception"
                                            value="low"
                                            checked={getAnswer("audienceReception") === "low"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Baixa
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="audienceReception"
                                            value="medium"
                                            checked={getAnswer("audienceReception") === "medium"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Média
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="audienceReception"
                                            value="high"
                                            checked={getAnswer("audienceReception") === "high"}
                                            onChange={handleChange}
                                            onBlur={sendFormAnswers}
                                        /> Alta
                                    </label>
                                </div>

                                <div className="input-wrapper">
                                    <label>Principais destaques da ação:</label>
                                    <textarea
                                        name="extraHighlights"
                                        rows={3}
                                        value={getAnswer("extraHighlights")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                {/* Registros Fotográficos */}
                                <div className="sub-title-wrapper"><b>Registros Fotográficos</b></div>

                                <div className="input-wrapper">
                                    <label>Foto 01:</label>
                                    <input
                                        type="file"
                                        name="photo1"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadingByField.photo1 ? <small>Enviando foto 01...</small> : null}
                                    {getAnswer("photo1") ? <small>Arquivo enviado.</small> : null}
                                    <input
                                        type="text"
                                        name="photo1Caption"
                                        placeholder="Legenda / descrição"
                                        value={getAnswer("photo1Caption")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label>Foto 02:</label>
                                    <input
                                        type="file"
                                        name="photo2"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    {uploadingByField.photo2 ? <small>Enviando foto 02...</small> : null}
                                    {getAnswer("photo2") ? <small>Arquivo enviado.</small> : null}
                                    <input
                                        type="text"
                                        name="photo2Caption"
                                        placeholder="Legenda / descrição"
                                        value={getAnswer("photo2Caption")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                                <div className="input-wrapper">
                                    <label htmlFor="observations">Notas adicionais:</label>
                                    <textarea
                                        name="observations"
                                        id="observations"
                                        rows={10}
                                        value={getAnswer("observations")}
                                        onChange={handleChange}
                                        onBlur={sendFormAnswers}
                                    />
                                </div>

                            </div>
                            <div className="button-wrapper">
                                <button
                                    className="submit-button"
                                    onClick={handleFinalizeVisit}
                                >
                                    Finalizar visita
                                </button>
                            </div>
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
    )
}

export default VisitFormAnswers;
