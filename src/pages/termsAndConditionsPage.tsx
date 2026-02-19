import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentLegalDocumentsPublic } from "../controllers/legalDocuments/getCurrentLegalDocumentsPublic.controller";
import "../style/termsAndConditionsPage.css";
import { sanitizeLegalHtml } from "../utils/sanitizeLegalHtml";

function TermsAndConditionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);

  useEffect(() => {
    getCurrentLegalDocumentsPublic()
      .then((data) => {
        setTerms(data?.terms ?? null);
        setPrivacy(data?.privacy ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="terms-page">
      <div className="terms-card">
        <button type="button" className="terms-back-button" onClick={() => navigate(-1)}>
          Voltar
        </button>
        <h1>Termos e Privacidade</h1>
        {loading ? (
          <p>Carregando documentos...</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default TermsAndConditionsPage;
