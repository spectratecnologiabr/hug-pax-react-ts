import React, { useEffect, useState } from "react";
import { acceptLegalDocuments } from "../controllers/legalDocuments/acceptLegalDocuments.controller";
import { getCurrentLegalDocumentsPublic } from "../controllers/legalDocuments/getCurrentLegalDocumentsPublic.controller";
import { getCookies } from "../controllers/misc/cookies.controller";
import "../style/termsAndConditionsPage.css";
import { sanitizeLegalHtml } from "../utils/sanitizeLegalHtml";

function TermsAcceptancePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [terms, setTerms] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    getCurrentLegalDocumentsPublic()
      .then((data) => {
        setTerms(data?.terms ?? null);
        setPrivacy(data?.privacy ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept() {
    setSubmitting(true);
    try {
      await acceptLegalDocuments();
      const user = getCookies("userData");
      const role = user?.role;
      setAccepted(true);
      if (role === "consultant" || role === "coordinator" || role === "specialist_consultant") {
        window.location.href = "/consultant";
        return;
      }
      if (role === "admin") {
        window.location.href = "/admin";
        return;
      }
      window.location.href = "/dashboard";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="terms-page">
      <div className="terms-card">
        <h1>Aceite obrigatório de Termos (LGPD)</h1>
        {loading ? (
          <p>Carregando documentos...</p>
        ) : (
          <>
            <p>Para continuar usando a plataforma, confirme o aceite da versão atual.</p>
            <section>
              <h2>Termos de Uso {terms?.version ? `(v${terms.version})` : ""}</h2>
              <div
                className="terms-content"
                dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(terms?.content || "<p>Documento não publicado.</p>") }}
              />
            </section>
            <section>
              <h2>Política de Privacidade {privacy?.version ? `(v${privacy.version})` : ""}</h2>
              <div
                className="terms-content"
                dangerouslySetInnerHTML={{ __html: sanitizeLegalHtml(privacy?.content || "<p>Documento não publicado.</p>") }}
              />
            </section>
            <div className="terms-actions">
              <button type="button" onClick={handleAccept} disabled={submitting || accepted}>
                {submitting ? "Confirmando..." : "Li e aceito os Termos e a Política"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TermsAcceptancePage;
