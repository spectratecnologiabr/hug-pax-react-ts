import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"

import ConsultantMenubar from "../components/consultant/menubar"
import AdminMenubar from "../components/admin/menubar"
import CoordinatorMenubar from "../components/coordinator/menubar"
import { getOverviewData } from "../controllers/dash/overview.controller"
import {
  getSchoolFinalReport,
  type ISchoolFinalReportResponse,
} from "../controllers/consultant/getSchoolFinalReport.controller"
import { exportElementToPdf } from "../utils/exportElementToPdf"
import "../style/schoolFinalReportPage.css"

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("pt-BR")
}

function SchoolFinalReportPage() {
  const { collegeId } = useParams<{ collegeId: string }>()
  const parsedCollegeId = Number(collegeId)
  const isAdminPanel = window.location.pathname.startsWith("/admin")
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overviewData, setOverviewData] = useState<{ unreadNotifications?: number } | null>(null)
  const [report, setReport] = useState<ISchoolFinalReportResponse | null>(null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [exportingPdf, setExportingPdf] = useState(false)
  const reportSheetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    getOverviewData()
      .then(setOverviewData)
      .catch(() => setOverviewData(null))
  }, [])

  const loadReport = useCallback(async () => {
    if (!Number.isFinite(parsedCollegeId) || parsedCollegeId <= 0) {
      setError("Escola inválida.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await getSchoolFinalReport({
        collegeId: parsedCollegeId,
        from: from || undefined,
        to: to || undefined,
      })

      setReport(data)
    } catch (e: any) {
      const message = String(e?.response?.data?.message || "Falha ao carregar ficha escolar.")
      setError(message)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [parsedCollegeId, from, to])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const radarData = useMemo(() => {
    if (!report) return []
    return [
      { subject: "Engajamento", score: report.radar.score.engagement },
      { subject: "Domínio Docente", score: report.radar.score.teacherDomain },
      { subject: "Apoio da Gestão", score: report.radar.score.managementSupport },
    ]
  }, [report])

  const radarPolygonPoints = useMemo(() => {
    if (radarData.length !== 3) return ""
    const centerX = 150
    const centerY = 150
    const maxRadius = 105
    const angles = [-90, 30, 150]

    return radarData
      .map((item, index) => {
        const angle = (angles[index] * Math.PI) / 180
        const radius = (Math.max(0, Math.min(100, item.score)) / 100) * maxRadius
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        return `${x},${y}`
      })
      .join(" ")
  }, [radarData])

  const printRangeLabel = useMemo(() => {
    if (from && to) return `${formatDate(from)} a ${formatDate(to)}`
    if (from) return `A partir de ${formatDate(from)}`
    if (to) return `Até ${formatDate(to)}`
    return "Período completo"
  }, [from, to])

  const handleExportPdf = useCallback(async () => {
    if (!reportSheetRef.current || !report) return

    const safeSchoolName = String(report.school?.name || `escola-${parsedCollegeId}`)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()

    try {
      setExportingPdf(true)
      await exportElementToPdf({
        element: reportSheetRef.current,
        filename: `ficha-escolar-${safeSchoolName || parsedCollegeId}.pdf`,
        onClone: (clonedDocument) => {
          clonedDocument
            .querySelectorAll(".no-print")
            .forEach((node) => ((node as HTMLElement).style.display = "none"))
          clonedDocument
            .querySelectorAll(".print-only")
            .forEach((node) => ((node as HTMLElement).style.display = "block"))
        },
      })
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
    } finally {
      setExportingPdf(false)
    }
  }, [parsedCollegeId, report])

  return (
    <div className="admin-dashboard-container school-report-page">
      {isAdminPanel ? (
        <AdminMenubar />
      ) : isCoordinatorPanel ? (
        <CoordinatorMenubar />
      ) : (
        <ConsultantMenubar notificationCount={Number(overviewData?.unreadNotifications ?? 0)} />
      )}

      <main className="school-report-main">
        <header className="school-report-header no-print">
          <div>
            <h1>Ficha Escolar (Relatório Final)</h1>
            <p>
              Consolidado automático de consultoria pedagógica + engajamento dos educadores.
            </p>
          </div>
          <div className="school-report-actions">
            <button className="sr-secondary" onClick={() => window.history.back()}>
              Voltar
            </button>
            <button className="sr-primary" onClick={handleExportPdf} disabled={!report || exportingPdf || loading}>
              {exportingPdf ? "Gerando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </header>

        <section className="school-report-filters no-print">
          <label>
            <span>De</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>Até</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="sr-secondary" onClick={loadReport}>
            Atualizar período
          </button>
        </section>

        {loading && <div className="sr-feedback">Carregando ficha escolar...</div>}
        {!loading && error && <div className="sr-feedback error">{error}</div>}

        {!loading && !error && report && (
          <article ref={reportSheetRef} className="school-report-sheet" aria-label="Ficha escolar consolidada" data-export="school-report-sheet">
            <header className="sr-print-header print-only">
              <h1>Ficha Escolar (Relatório Final)</h1>
              <p>Período consultado: {printRangeLabel}</p>
            </header>

            <section className="sr-meta-grid">
              <div className="sr-meta-card">
                <b>Escola</b>
                <span>{report.school.name}</span>
              </div>
              <div className="sr-meta-card">
                <b>Cidade/UF</b>
                <span>{[report.school.city, report.school.state].filter(Boolean).join("/") || "—"}</span>
              </div>
              <div className="sr-meta-card">
                <b>Consultor Responsável</b>
                <span>{report.school.consultantName || "—"}</span>
              </div>
              <div className="sr-meta-card">
                <b>Gerado em</b>
                <span>{new Date(report.generatedAt).toLocaleString("pt-BR")}</span>
              </div>
            </section>

            <section className="sr-kpi-grid">
              <div className="sr-kpi">
                <b>Índice de Consultoria</b>
                <strong>{report.consultancy.index}%</strong>
              </div>
              <div className="sr-kpi">
                <b>Engajamento Médio</b>
                <strong>{report.educatorsEngagement.avgProgress}%</strong>
              </div>
              <div className="sr-kpi highlight">
                <b>Índice Consolidado</b>
                <strong>{report.consolidated.index}%</strong>
                <small>{report.consolidated.note}</small>
              </div>
            </section>

            <section className="sr-section">
              <h2>Métricas Gerais de Consultoria</h2>
              <div className="sr-table-like">
                <div><span>Total de visitas</span><b>{report.consultancy.totalVisits}</b></div>
                <div><span>Visitas concluídas</span><b>{report.consultancy.completedVisits}</b></div>
                <div><span>Visitas agendadas</span><b>{report.consultancy.scheduledVisits}</b></div>
                <div><span>Visitas canceladas</span><b>{report.consultancy.cancelledVisits}</b></div>
                <div><span>Reagendamentos</span><b>{report.consultancy.rescheduledVisits}</b></div>
                <div><span>Consultores envolvidos</span><b>{report.consultancy.consultantsInvolved}</b></div>
                <div><span>Primeira visita</span><b>{formatDate(report.consultancy.firstVisitDate)}</b></div>
                <div><span>Última visita</span><b>{formatDate(report.consultancy.lastVisitDate)}</b></div>
              </div>
            </section>

            <section className="sr-section">
              <h2>Indicadores do Formulário de Visita</h2>
              <div className="sr-table-like">
                <div><span>Educadores cadastrados (Sim)</span><b>{report.formIndicators?.educatorsRegistered?.yes ?? 0}</b></div>
                <div><span>Educadores cadastrados (Não)</span><b>{report.formIndicators?.educatorsRegistered?.no ?? 0}</b></div>
                <div><span>Livros disponíveis (Sim)</span><b>{report.formIndicators?.booksAvailable?.yes ?? 0}</b></div>
                <div><span>Livros disponíveis (Não)</span><b>{report.formIndicators?.booksAvailable?.no ?? 0}</b></div>
                <div><span>Coleta de dados finalizada</span><b>{report.formIndicators?.dataCollectionStatus?.finished ?? 0}</b></div>
                <div><span>Coleta em andamento</span><b>{report.formIndicators?.dataCollectionStatus?.collecting ?? 0}</b></div>
                <div><span>Média do suporte da gestão (1-5)</span><b>{report.formIndicators?.supportRating?.avg ?? 0}</b></div>
                <div><span>Respostas de avaliação de suporte</span><b>{report.formIndicators?.supportRating?.responses ?? 0}</b></div>
                <div><span>Meta anterior cumprida</span><b>{report.formIndicators?.previousGoalMet?.yes ?? 0}</b></div>
                <div><span>Meta anterior parcial</span><b>{report.formIndicators?.previousGoalMet?.partial ?? 0}</b></div>
                <div><span>Meta anterior não cumprida</span><b>{report.formIndicators?.previousGoalMet?.no ?? 0}</b></div>
                <div><span>Interesse em expandir programa (Sim)</span><b>{report.formIndicators?.expandInterest?.yes ?? 0}</b></div>
                <div><span>Ações extras realizadas</span><b>{report.formIndicators?.extraAction?.yes ?? 0}</b></div>
                <div><span>Participantes em ações extras</span><b>{report.formIndicators?.extraAction?.participantsTotal ?? 0}</b></div>
                <div><span>Receptividade alta</span><b>{report.formIndicators?.audienceReception?.high ?? 0}</b></div>
                <div><span>Sem evidência de prática (uso protocolar)</span><b>{report.formIndicators?.practiceEvidence?.noneOnly ?? 0}</b></div>
              </div>
            </section>

            <section className="sr-section">
              <h2>Engajamento dos Educadores</h2>
              <div className="sr-table-like">
                <div><span>Total de educadores</span><b>{report.educatorsEngagement.educatorsTotal}</b></div>
                <div><span>Educadores engajados</span><b>{report.educatorsEngagement.educatorsEngaged}</b></div>
                <div><span>Taxa de engajamento</span><b>{report.educatorsEngagement.engagementRate}%</b></div>
                <div><span>Conclusão 100%</span><b>{report.educatorsEngagement.educatorsCompletion100}</b></div>
              </div>
            </section>

            <section className="sr-section">
              <h2>Radar de Competências</h2>
              <div className="sr-radar-layout">
                <div className="sr-radar-canvas" role="img" aria-label="Gráfico radar de competências consolidadas">
                  <svg viewBox="0 0 300 300" width="100%" height="320" aria-hidden="true">
                    <polygon points="150,45 241,202.5 59,202.5" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                    <polygon points="150,85 208,185 92,185" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <polygon points="150,120 183,174 117,174" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="150" y1="150" x2="150" y2="45" stroke="#e2e8f0" />
                    <line x1="150" y1="150" x2="241" y2="202.5" stroke="#e2e8f0" />
                    <line x1="150" y1="150" x2="59" y2="202.5" stroke="#e2e8f0" />
                    <polygon points={radarPolygonPoints} fill="#14b8a658" stroke="#0d9488" strokeWidth="2" />
                    <text x="150" y="28" textAnchor="middle" fontSize="12" fill="#334155">Engajamento</text>
                    <text x="258" y="214" textAnchor="start" fontSize="12" fill="#334155">Domínio</text>
                    <text x="42" y="214" textAnchor="end" fontSize="12" fill="#334155">Gestão</text>
                  </svg>
                </div>

                <div className="sr-radar-summary">
                  <div><span>Engajamento</span><b>{report.radar.score.engagement}%</b></div>
                  <div><span>Domínio Docente</span><b>{report.radar.score.teacherDomain}%</b></div>
                  <div><span>Apoio da Gestão</span><b>{report.radar.score.managementSupport}%</b></div>
                </div>
              </div>
            </section>

          </article>
        )}
      </main>
    </div>
  )
}

export default SchoolFinalReportPage
