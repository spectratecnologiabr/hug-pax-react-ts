import React, { useMemo, useState } from "react"
import Menubar from "../components/admin/menubar"
import Footer from "../components/footer"
import { getDocumentData } from "../controllers/certificates/getDocumentData.controller"

import "../style/adminCertificatesPage.css"

import { ReactComponent as IconSearch } from "../img/adminCertificates/search.svg"
import { ReactComponent as IconCheck } from "../img/adminCertificates/check.svg"
import { ReactComponent as IconAward } from "../img/adminCertificates/award.svg"
import { ReactComponent as IconX } from "../img/adminCertificates/x.svg"

type TCertificateDoc = {
  certificateCode: string
  userName: string
  courseTitle: string
  hours: number
  issuedAt: string
  modules: Array<string>
}

function AdminCertificatesPage() {
    const [topSearch, setTopSearch] = useState("")
    const [verifyQuery, setVerifyQuery] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [verifyError, setVerifyError] = useState<string | null>(null)
    const [verifyResult, setVerifyResult] = useState<TCertificateDoc | null>(null)

    const summary = useMemo(
      () => ({
        valid: 1847,
        totalIssued: 2156,
        frauds: 23,
      }),
      []
    )

    async function handleVerify() {
      const q = verifyQuery.trim()
      if (!q) return

      setVerifying(true)
      setVerifyError(null)
      setVerifyResult(null)
      try {
        const data = await getDocumentData(q)
        setVerifyResult(data as TCertificateDoc)
      } catch (e) {
        console.error("Erro ao verificar certificado", e)
        setVerifyError("Não foi possível verificar. Confira o código/CPF e tente novamente.")
      } finally {
        setVerifying(false)
      }
    }

    return (
        <div className="admin-dashboard-container">
          <Menubar />

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
                  <b>{summary.valid.toLocaleString("pt-BR")}</b>
                  <span>Válidos</span>
                </div>
              </div>

              <div className="acp-summary-card total">
                <div className="acp-summary-icon total">
                  <IconAward aria-hidden="true" />
                </div>
                <div className="acp-summary-content">
                  <b>{summary.totalIssued.toLocaleString("pt-BR")}</b>
                  <span>Total Emitidos</span>
                </div>
              </div>

              <div className="acp-summary-card fraud">
                <div className="acp-summary-icon fraud">
                  <IconX aria-hidden="true" />
                </div>
                <div className="acp-summary-content">
                  <b>{summary.frauds.toLocaleString("pt-BR")}</b>
                  <span>Fraudes Detectadas</span>
                </div>
              </div>
            </div>

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
