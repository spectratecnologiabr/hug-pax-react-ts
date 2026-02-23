import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { findVisit } from "../controllers/consultant/findVisit.controller";
import { findUser } from "../controllers/user/findUser.controller";
import { getCookies } from "../controllers/misc/cookies.controller";
import { exportElementToPdf } from "../utils/exportElementToPdf";

import "../style/visitReport.css";

const VisitReportPreview: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [visitData, setVisitData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultantName, setConsultantName] = useState<string>("");
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<Record<string, string>>({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchVisit() {
      console.log("VisitReportPreview mounted with visitId:", visitId);

      if (visitId === undefined) {
        console.warn("ID da visita não encontrado na rota");
        return;
      }

      try {
        setLoading(true);

        const visitIdNumber = Number(visitId);

        if (Number.isNaN(visitIdNumber)) {
          console.error("ID inválido recebido na rota:", visitId);
          return;
        }

        const response = await findVisit(visitIdNumber);

        // normaliza retorno (api pode retornar direto ou dentro de data)
        const data = response?.data ?? response;

        setVisitData(data);

        const creatorId = Number(data?.creatorId ?? data?.creator_id);
        if (Number.isFinite(creatorId) && creatorId > 0) {
          try {
            const consultant = await findUser(creatorId);
            const consultantData = consultant?.data ?? consultant;
            setConsultantName(
              [consultantData.firstName, consultantData.lastName]
                .filter(Boolean)
                .join(" ")
            );
          } catch (err) {
            console.error("Erro ao buscar consultor:", err);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar visita:", error);
        setVisitData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVisit();
  }, [visitId]);

  const formAnswers = visitData?.formAnswers ?? visitData?.visitFormAnswers ?? [];


  const VALUE_TRANSLATIONS: Record<string, Record<string, string>> = {
    educatorsRegistered: {
      yes: "Sim",
      no: "Não",
    },
    booksAvailable: {
      yes: "Sim",
      no: "Não",
    },
    extraAction: {
      yes: "Sim",
      no: "Não",
    },
    previousGoalMet: {
      yes: "Sim",
      no: "Não",
      partial: "Parcialmente",
    },
    visitType: {
      initial: "Formação inicial",
      followup: "Acompanhamento",
    },

    // 🔹 Status de coleta de dados
    dataCollectionStatus: {
      collecting: "Em coleta (Respondendo)",
      completed: "Coleta finalizada (Dados prontos para geração de relatórios)",
      not_started: "Não iniciada",
    },

    // 🔹 Radar de Evolução
    engagement: {
      evolved: "Evoluiu",
      stable: "Manteve-se estável",
      regressed: "Regrediu",
    },
    teacherDomain: {
      evolved: "Evoluiu",
      stable: "Manteve-se estável",
      regressed: "Regrediu",
    },
    managementSupport: {
      evolved: "Evoluiu",
      stable: "Manteve-se estável",
      regressed: "Regrediu",
    },
  };

  const getAnswer = (name: string) => {
    const answer = formAnswers.find((f: any) => f.name === name);
    if (!answer) return "";

    const rawValue = answer.value;

    // array (checkbox)
    if (Array.isArray(rawValue)) {
      return rawValue
        .map((v) => VALUE_TRANSLATIONS[name]?.[v] ?? v)
        .join(", ");
    }

    // valor simples
    return VALUE_TRANSLATIONS[name]?.[rawValue] ?? rawValue ?? "";
  };

  const getRawAnswer = (name: string) => {
    const answer = formAnswers.find((f: any) => f.name === name);
    return answer?.value ?? "";
  };

  const extractPhotoSource = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const candidates = [
        obj.key,
        obj.path,
        obj.url,
        obj.cdnKey,
        obj.fileKey,
        obj.value,
      ];

      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
    }

    return "";
  };

  const resolvePhotoUrl = (value: unknown) => {
    const raw = extractPhotoSource(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;

    const cdnBase = String(process.env.REACT_APP_CDN_URL || "").replace(/\/+$/, "");
    if (cdnBase) return `${cdnBase}/api/stream/${encodeURIComponent(raw)}`;

    const apiBase = String(process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    if (apiBase) return `${apiBase}/files/stream/${encodeURIComponent(raw)}`;

    return "";
  };

  function resolveProtectedPhotoRequest(value: unknown) {
    const raw = extractPhotoSource(value);
    if (!raw) return null;

    const token = getCookies("authToken");
    const apiBaseUrl = String(process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    const cdnBaseUrl = String(process.env.REACT_APP_CDN_URL || "").replace(/\/+$/, "");

    if (/^https?:\/\//i.test(raw)) {
      if (apiBaseUrl && raw.startsWith(`${apiBaseUrl}/files/stream/`)) {
        return {
          url: raw,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      }

      if (cdnBaseUrl && raw.startsWith(`${cdnBaseUrl}/api/stream/`) && apiBaseUrl) {
        const key = decodeURIComponent(raw.slice(`${cdnBaseUrl}/api/stream/`.length));
        return {
          url: `${apiBaseUrl}/files/stream/${encodeURIComponent(key)}`,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };
      }

      return { url: raw };
    }

    if (!apiBaseUrl) return null;
    return {
      url: `${apiBaseUrl}/files/stream/${encodeURIComponent(raw)}`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    };
  }

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadPhotoPreviews() {
      const photoValues = {
        photo1: getRawAnswer("photo1"),
        photo2: getRawAnswer("photo2"),
      };

      const nextUrls: Record<string, string> = {};

      for (const [key, value] of Object.entries(photoValues)) {
        const request = resolveProtectedPhotoRequest(value);
        if (!request?.url) continue;

        try {
          const response = await fetch(request.url, { headers: request.headers });
          if (!response.ok) {
            nextUrls[key] = resolvePhotoUrl(value);
            continue;
          }

          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          nextUrls[key] = objectUrl;
        } catch {
          nextUrls[key] = resolvePhotoUrl(value);
        }
      }

      if (!cancelled) {
        setPhotoPreviewUrls(nextUrls);
      }
    }

    loadPhotoPreviews();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => window.URL.revokeObjectURL(url));
    };
  }, [visitData]);

  const photo1Url = photoPreviewUrls.photo1 || resolvePhotoUrl(getRawAnswer("photo1"));
  const photo2Url = photoPreviewUrls.photo2 || resolvePhotoUrl(getRawAnswer("photo2"));

  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return;

    try {
      setExportingPdf(true);
      await exportElementToPdf({
        element: reportRef.current,
        filename: `relatorio-visita-${visitData?.id ?? visitId ?? "detalhes"}.pdf`,
        onClone: (clonedDocument) => {
          clonedDocument
            .querySelectorAll(".no-print")
            .forEach((node) => ((node as HTMLElement).style.display = "none"));
        },
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setExportingPdf(false);
    }
  }, [visitData?.id, visitId]);

  const isFirstVisit = visitData?.visitType === "initial";
  const isAno1 = visitData?.institutionProfile === "Ano 1";
  const isAno2Plus = visitData?.institutionProfile === "Ano 2+";

  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Labels exactly as in the official form
  const QUESTION_LABELS: Record<string, string> = {
    educatorsRegistered: "Todos os educadores cadastrados na PAX antes da visita?",
    educatorsReason: "Motivo",
    educatorsWithoutAccess: "Educadores sem acesso (nomes ou perfis)",
    booksAvailable: "Todos possuem livros?",
    missingBooks: "Quantidade de livros faltantes",
    missingBooksReason: "Justificativa da falta",
    dataCollectionStatus: "Status atual da coleta de dados",

    engagement: "Engajamento dos Alunos",
    teacherDomain: "Domínio do Professor",
    managementSupport: "Apoio da Gestão",

    practiceEvidence: "Evidência de Prática Observada",

    managementChallenge: "Maior desafio para engajar professores",
    supportRating: "O suporte atende às expectativas (1 a 5)",
    visibleImpact: "Impacto mais visível hoje",
    expandInterest: "Interesse em expandir o programa",

    generalFeedback: "Feedback geral da gestão",

    visitSummary: "Resumo da Visita",
    keyInsights: "Destaques principais",
    nextVisitAgreement: "Acordo para a próxima visita",
    previousGoalMet: "Meta anterior cumprida",

    extraAction: "Houve ação extra?",
    extraActionDate: "Data da ação extra",
    extraActionName: "Ação realizada",
    extraActionAudience: "Público atendido",
    extraActionAmount: "Quantidade de participantes",
    audienceReception: "Receptividade do público",
    extraHighlights: "Principais destaques da ação"
  };

  const renderRow = (name: string) => {
    const value = getAnswer(name);
    if (!value) return null;

    return (
      <div className="report-row">
        <span className="label">{QUESTION_LABELS[name] ?? name}:</span>
        <span>{value}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="report-loading">Carregando relatório...</div>;
  }

  if (!visitData) {
    return <div className="report-loading">Relatório não encontrado</div>;
  }


  return (
    <div className="report-container" ref={reportRef} data-export="visit-report">
      <button className="report-back-button no-print" onClick={() => window.history.back()}>
        Voltar
      </button>
      <h1>Relatório de Visita de Consultoria Pedagógica</h1>

      <section className="report-section">
        <h2>1. Identificação e Logística</h2>
        <div className="report-row">
          <span className="label">Data da Visita:</span>
          <span>{formatDate(visitData.visitDate)}</span>
        </div>
        <div className="report-row">
          <span className="label">Consultor(a) Responsável:</span>
          <span>{consultantName || "—"}</span>
        </div>
        <div className="report-row">
          <span className="label">Instituição / Escola:</span>
          <span>{visitData.collegeName}</span>
        </div>
        <div className="report-row">
          <span className="label">Perfil da Instituição:</span>
          <span>
            {visitData.institutionProfile === "Ano 1"
              ? "Escola em Implantação (Ano 1)"
              : "Escola Veterana (Ano 2+)"}
          </span>
        </div>
        <div className="report-row">
          <span className="label">Tipo de Visita:</span>
          <span>
            {VALUE_TRANSLATIONS.visitType?.[visitData.visitType] ??
              visitData.visitType}
          </span>
        </div>
      </section>

      <section className="report-section">
        <h2>2. Painel Logístico e Administrativo</h2>
        {renderRow("educatorsRegistered")}
        {getAnswer("educatorsRegistered") === "no" && (
          <>
            {renderRow("educatorsReason")}
            {renderRow("educatorsWithoutAccess")}
          </>
        )}
        {renderRow("booksAvailable")}
        {getAnswer("booksAvailable") === "no" && (
          <>
            {renderRow("missingBooks")}
            {renderRow("missingBooksReason")}
          </>
        )}
        {renderRow("dataCollectionStatus")}
      </section>

      {!isFirstVisit && (
        <section className="report-section">
          <h2>Radar de Evolução</h2>
          {renderRow("engagement")}
          {renderRow("teacherDomain")}
          {renderRow("managementSupport")}
        </section>
      )}

      <section className="report-section">
        <h2>Evidências de Prática Observada</h2>
        {renderRow("practiceEvidence")}
      </section>

      {isAno1 && (
        <section className="report-section">
          <h2>Voz da Gestão — Ano 1</h2>
          {renderRow("managementChallenge")}
          {renderRow("supportRating")}
        </section>
      )}

      {isAno2Plus && (
        <section className="report-section">
          <h2>Voz da Gestão — Ano 2+</h2>
          {renderRow("visibleImpact")}
          {renderRow("expandInterest")}
          {renderRow("supportRating")}
        </section>
      )}

      <section className="report-section">
        <h2>Resumo e Plano de Ação</h2>
        {renderRow("visitSummary")}
        {renderRow("keyInsights")}
        {renderRow("nextVisitAgreement")}
        {!isFirstVisit && renderRow("previousGoalMet")}
      </section>

      {getAnswer("extraAction") === "yes" && (
        <section className="report-section">
          <h2>Ação Extra</h2>
          {renderRow("extraActionDate")}
          {renderRow("extraActionName")}
          {renderRow("extraActionAudience")}
          {renderRow("extraActionAmount")}
          {renderRow("audienceReception")}
          {renderRow("extraHighlights")}
        </section>
      )}

      {(photo1Url || photo2Url) && (
        <section className="report-section">
          <h2>Registros Fotográficos</h2>
          {photo1Url ? (
            <div className="report-photo-block">
              <span className="label">Foto 01:</span>
              <a href={photo1Url} target="_blank" rel="noreferrer" className="report-photo-link">
                <img src={photo1Url} alt="Foto 01 da visita" className="report-photo-preview" />
              </a>
              {getAnswer("photo1Caption") ? (
                <p className="report-photo-caption">{getAnswer("photo1Caption")}</p>
              ) : null}
            </div>
          ) : null}
          {photo2Url ? (
            <div className="report-photo-block">
              <span className="label">Foto 02:</span>
              <a href={photo2Url} target="_blank" rel="noreferrer" className="report-photo-link">
                <img src={photo2Url} alt="Foto 02 da visita" className="report-photo-preview" />
              </a>
              {getAnswer("photo2Caption") ? (
                <p className="report-photo-caption">{getAnswer("photo2Caption")}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      <button className="report-print-button no-print" onClick={handleExportPdf} disabled={exportingPdf}>
        {exportingPdf ? "Gerando PDF..." : "Gerar PDF"}
      </button>
    </div>
  );
};

export default VisitReportPreview;
