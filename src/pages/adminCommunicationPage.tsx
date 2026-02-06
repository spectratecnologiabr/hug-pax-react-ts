import React, { useEffect, useState } from "react";
import CommunicationModal from "../components/admin/CommunicationModal";
import { getCommunicationById } from "../controllers/communication/getCommunicationById.controller";
import Menubar from "../components/admin/menubar";
import "../style/adminCommunication.css";
import { listCommunications } from "../controllers/communication/listCommunications.controller";
import { getCommunicationsSummary } from "../controllers/communication/getCommunicationsSummary.controller";
import { sendCommunicationNow } from "../controllers/communication/sendCommunicationNow.controller";

type Summary = { sent: number; scheduled: number; draft: number; failed: number };
type Communication = {
  id: number;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  preview?: string;
  targetSummary?: string;
};

function AdminCommunicationPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<Communication[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);

  const communicationStatusLabel: Record<string, string> = {
    sent: 'Enviada',
    scheduled: 'Agendada',
    draft: 'Rascunho',
    processing: 'Enviando',
    failed: 'Falhou'
  };

  function htmlToPlainText(html?: string) {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  async function openEdit(id: number) {
    const data = await getCommunicationById(id);
    setEditing(data);
    setOpenModal(true);
    setOpenActionsId(null);
  }

  async function load() {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        getCommunicationsSummary(),
        listCommunications({ status: status === "all" ? undefined : status, search: search || undefined })
      ]);
      setSummary(s);
      setRows(l.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendNow(id: number) {
    await sendCommunicationNow(id);
    setOpenActionsId(null);
    load();
  }

  useEffect(() => {
    load();
  }, [status, search]);

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper sap-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Comunicações</b>
            <span>Gerencie mensagens e avisos</span>
          </div>
          <div className="sap-top-actions">
            <button
              className="sap-primary"
              type="button"
              onClick={() => { setEditing(null); setOpenModal(true); }}
            >
              + Nova Comunicação
            </button>
          </div>
        </div>

        {summary && (
          <div className="sap-summary-grid">
            <div className="sap-summary-card">
                <div className="sap-summary-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B77F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-send w-5 h-5"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"></path><path d="m21.854 2.147-10.94 10.939"></path></svg>
                </div>
                <div className="sap-summary-content">
                    <b>{summary.sent}</b>
                    <span>Enviadas</span>
                </div>
            </div>
            <div className="sap-summary-card">
                <div className="sap-summary-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B5CB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-clock w-5 h-5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="sap-summary-content">
                    <b>{summary.scheduled}</b>
                    <span>Agendadas</span>
                </div>
            </div>
            <div className="sap-summary-card">
                <div className="sap-summary-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F8C630" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-text w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>
                </div>
                <div className="sap-summary-content">
                    <b>{summary.draft}</b>
                    <span>Rascunhos</span>
                </div>
            </div>
            <div className="sap-summary-card">
                <div className="sap-summary-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E85D4A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-alert w-5 h-5"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                </div>
                <div className="sap-summary-content">
                    <b>{summary.failed}</b>
                    <span>Falhas</span>
                </div>
            </div>
          </div>
        )}

        <div className="sap-filters">
          <div className="sap-input sap-input-wide">
            <input placeholder="Buscar comunicações..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="sap-select">
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">Todos os status</option>
              <option value="sent">Enviadas</option>
              <option value="scheduled">Agendadas</option>
              <option value="draft">Rascunhos</option>
              <option value="failed">Falhas</option>
            </select>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-header">
            <b>Histórico de Comunicações</b>
          </div>

          {loading ? (
            <div className="sap-empty"><b>Carregando...</b><span>Buscando comunicações</span></div>
          ) : rows.length ? (
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Mensagem</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Público</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr
                    key={r.id}
                    onClick={r.status !== 'sent' ? () => openEdit(r.id) : () => {}}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="sap-msg-cell">
                        <b>{r.title}</b>
                        <span>{htmlToPlainText(r.message) || "Prévia da mensagem..."}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sap-status ${r.status}`}>{communicationStatusLabel[r.status]}</span>
                    </td>
                    <td className="sap-date">
                      {r.sentAt
                        ? new Date(r.sentAt).toLocaleString()
                        : r.scheduledAt
                        ? new Date(r.scheduledAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="sap-audience">
                      {r.targetSummary || '—'}
                    </td>
                    <td className="sap-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="sap-actions-trigger"
                        onClick={() => setOpenActionsId(openActionsId === r.id ? null : r.id)}
                      >
                        ⋮
                      </button>
                      {openActionsId === r.id && (
                        <div className="sap-actions-menu">
                          <button onClick={() => { setOpenActionsId(null); openEdit(r.id); }} disabled={r.status === 'sent'}>Editar</button>
                          <button onClick={() => handleSendNow(r.id)} disabled={r.status !== "draft"}>Enviar agora</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="sap-empty"><b>Nada por aqui</b><span>Nenhuma comunicação encontrada</span></div>
          )}
        </div>
        <CommunicationModal
          opened={openModal}
          initialData={editing}
          onClose={() => {
            setOpenModal(false);
            setEditing(null);
            load();
          }}
        />
      </div>
    </div>
  );
}

export default AdminCommunicationPage;