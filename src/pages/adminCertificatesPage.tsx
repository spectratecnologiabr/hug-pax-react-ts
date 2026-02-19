import React, { useEffect, useMemo, useState } from "react"
import Menubar from "../components/admin/menubar"
import CoordinatorMenubar from "../components/coordinator/menubar"
import Footer from "../components/footer"
import { getCertificatesSummaryAdmin } from "../controllers/certificates/getCertificatesSummaryAdmin.controller"
import { verifyCertificateAdmin, type TCertificateDocument } from "../controllers/certificates/verifyCertificateAdmin.controller"

import "../style/adminCertificatesPage.css"

import { ReactComponent as IconSearch } from "../img/adminCertificates/search.svg"
import { ReactComponent as IconCheck } from "../img/adminCertificates/check.svg"
import { ReactComponent as IconAward } from "../img/adminCertificates/award.svg"
import { ReactComponent as IconX } from "../img/adminCertificates/x.svg"

function AdminCertificatesPage() {
    const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator")
    const [topSearch, setTopSearch] = useState("")
    const [verifyQuery, setVerifyQuery] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [verifyError, setVerifyError] = useState<string | null>(null)
    const [verifyResult, setVerifyResult] = useState<TCertificateDocument | null>(null)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)

    const summary = useMemo(
      () => ({
        valid: 0,
        totalIssued: 0,
        frauds: 0,
      }),
      []
    )

    const [summaryData, setSummaryData] = useState(summary)

    useEffect(() => {
      let cancelled = false

      async function loadSummary() {
        setSummaryLoading(true)
        setSummaryError(null)
        try {
          const data = await getCertificatesSummaryAdmin()
          if (cancelled) return

          const valid =
            (data as any)?.valid ??
            (data as any)?.valids ??
            (data as any)?.validTotal ??
            (data as any)?.validCertificates ??
            0

          const totalIssued =
            (data as any)?.totalIssued ??
            (data as any)?.total ??
            (data as any)?.totalEmitted ??
            (data as any)?.issued ??
            0

          const frauds =
            (data as any)?.frauds ??
            (data as any)?.fraudsDetected ??
            (data as any)?.fraud ??
            0

          setSummaryData({
            valid: Number(valid ?? 0),
            totalIssued: Number(totalIssued ?? 0),
            frauds: Number(frauds ?? 0),
          })
        } catch (e) {
          console.error("Erro ao carregar resumo de certificados", e)
          if (!cancelled) setSummaryError("Não foi possível carregar os dados de certificados.")
        } finally {
          if (!cancelled) setSummaryLoading(false)
        }
      }

      loadSummary()
      return () => {
        cancelled = true
      }
    }, [])

    async function handleVerify() {
      const q = verifyQuery.trim()
      if (!q) return

      setVerifying(true)
      setVerifyError(null)
      setVerifyResult(null)
      try {
        const data = await verifyCertificateAdmin(q)
        setVerifyResult(data)
      } catch (e) {
        console.error("Erro ao verificar certificado", e)
        setVerifyError("Não foi possível verificar. Confira o código/CPF e tente novamente.")
      } finally {
        setVerifying(false)
      }
    }

    return (
        <div className="admin-dashboard-container">
          {isCoordinatorPanel ? <CoordinatorMenubar /> : <Menubar />}

          <div className="admin-dashboard-wrapper sap-page admin-certificates-page">
            <div className="admin-header-wrapper">
              <div>
                <b>Certificados</b>
                <span>Verifique a autenticidade de certificados</span>
              </div>
              <form
                className="acp-top-search"
                role="search"
                aria-label="Buscar"
                onSubmit={e => e.preventDefault()}
              >
                <IconSearch className="acp-top-search-icon" aria-hidden="true" />
                <input
                  placeholder="Buscar alunos, cursos, comunicações..."
                  value={topSearch}
                  onChange={e => setTopSearch(e.target.value)}
                />
              </form>
            </div>

            <div className="acp-summary-grid">
              <div className="acp-summary-card valid">
                <div className="acp-summary-icon valid">
                  <IconCheck aria-hidden="true" />
                </div>
                <div className="acp-summary-content">
                  <b>{summaryLoading ? "—" : summaryData.valid.toLocaleString("pt-BR")}</b>
                  <span>Válidos</span>
                </div>
              </div>

              <div className="acp-summary-card total">
                <div className="acp-summary-icon total">
                  <IconAward aria-hidden="true" />
                </div>
                <div className="acp-summary-content">
                  <b>{summaryLoading ? "—" : summaryData.totalIssued.toLocaleString("pt-BR")}</b>
                  <span>Total Emitidos</span>
                </div>
              </div>

              <div className="acp-summary-card fraud">
                <div className="acp-summary-icon fraud">
                  <IconX aria-hidden="true" />
                </div>
                <div className="acp-summary-content">
                  <b>{summaryLoading ? "—" : summaryData.frauds.toLocaleString("pt-BR")}</b>
                  <span>Fraudes Detectadas</span>
                </div>
              </div>
            </div>

            {summaryError && <div className="acp-summary-error">{summaryError}</div>}

            <div className="acp-verify-card">
              <div className="acp-verify-title">
                <IconSearch aria-hidden="true" />
                <span>Verificar Certificado</span>
              </div>

              <div className="acp-verify-form">
                <div className="acp-verify-input">
                  <input
                    placeholder="Digite o CPF ou código do certificado..."
                    value={verifyQuery}
                    onChange={e => setVerifyQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleVerify()
                    }}
                  />
                </div>
                <button className="acp-verify-btn" onClick={handleVerify} disabled={!verifyQuery.trim() || verifying}>
                  <IconSearch aria-hidden="true" />
                  {verifying ? "Buscando..." : "Buscar"}
                </button>
              </div>

              <div className="acp-verify-help">Exemplos: PAX-2026-001234 ou 123 456 789-00</div>
            </div>

            <div className="acp-result-card">
              {!verifyResult && !verifyError && (
                <div className="acp-empty">
                  <div className="acp-empty-icon">
                    <IconAward aria-hidden="true" />
                  </div>
                  <b>Verificação de Autenticidade</b>
                  <p>
                    Digite o CPF do aluno ou o código do certificado para verificar
                    se o documento é autêntico e foi emitido pela instituição PAX.
                  </p>
                </div>
              )}

              {verifyError && (
                <div className="acp-error">
                  <b>Não foi possível verificar</b>
                  <span>{verifyError}</span>
                </div>
              )}

              {verifyResult && (
                <div className="acp-result">
                  <div className="acp-result-status">
                    <span className="acp-result-badge">✓</span>
                    <span>Certificado válido e autenticado</span>
                  </div>
                  <div className="acp-result-grid">
                    <div>
                      <strong>Nome do participante:</strong> <b>{verifyResult.userName}</b>
                    </div>
                    <div>
                      <strong>Curso / Formação:</strong> {verifyResult.courseTitle}
                    </div>
                    <div>
                      <strong>Carga horária:</strong> {verifyResult.hours} horas
                    </div>
                    <div>
                      <strong>Emitido em:</strong> {new Date(verifyResult.issuedAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div>
                      <strong>Código:</strong> {verifyResult.certificateCode}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Footer />
        </div>
    )
}

export default AdminCertificatesPage
