import React, { useEffect, useMemo, useState } from "react";
import Menubar from "../components/admin/menubar";
import {
  appendHelpdeskMessage,
  HelpdeskTicket,
  HelpdeskTicketCategory,
  HelpdeskTicketStatus,
  listAllHelpdeskTickets,
  updateHelpdeskTicketStatus,
} from "../controllers/helpdesk/helpdeskLocal.controller";
import "../style/adminHelpdeskPage.css";

const CATEGORY_LABEL: Record<HelpdeskTicketCategory, string> = {
  "erro-em-aula": "Erro em Aula",
  "suporte-tecnico": "Suporte Técnico",
  "suporte-pedagogico": "Suporte Pedagógico",
  "duvida-administrativa": "Dúvida Administrativa",
};

const STATUS_LABEL: Record<HelpdeskTicketStatus, string> = {
  aberto: "Aberto",
  "em-atendimento": "Em atendimento",
  "aguardando-usuario": "Aguardando usuário",
  resolvido: "Resolvido",
};

function toDisplayDate(raw?: string) {
  if (!raw) return "-";
  return new Date(raw).toLocaleString("pt-BR");
}

function AdminHelpdeskPage() {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | HelpdeskTicketStatus>("all");
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const selected = useMemo(() => tickets.find((ticket) => String(ticket.id) === selectedId) || null, [selectedId, tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hit = `${ticket.title} ${ticket.userName} ${ticket.userSchool || ""} ${CATEGORY_LABEL[ticket.category]}`.toLowerCase();
        if (!hit.includes(q)) return false;
      }
      return true;
    });
  }, [query, statusFilter, tickets]);

  async function refresh(nextSelectedId?: string) {
    const updated = await listAllHelpdeskTickets();
    setTickets(updated);
    const keepId = nextSelectedId || selectedId || String(updated[0]?.id || "");
    setSelectedId(keepId);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const updated = await listAllHelpdeskTickets();
        if (!mounted) return;
        setTickets(updated);
        if (updated[0]?.id) {
          setSelectedId(String(updated[0].id));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    await appendHelpdeskMessage(selected.id, reply, "agent");
    setReply("");
    await refresh(String(selected.id));
  }

  async function handleStatusChange(status: HelpdeskTicketStatus) {
    if (!selected) return;
    await updateHelpdeskTicketStatus(selected.id, status);
    await refresh(String(selected.id));
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper ahd-page">
        <div className="ahd-header">
          <div>
            <b>Central de Helpdesk</b>
            <span>Triagem, atendimento e gestão de chamados.</span>
          </div>
          <div className="ahd-filters">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, usuário ou categoria"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              <option value="all">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="em-atendimento">Em atendimento</option>
              <option value="aguardando-usuario">Aguardando usuário</option>
              <option value="resolvido">Resolvido</option>
            </select>
          </div>
        </div>

        <div className="ahd-grid">
          <aside className="ahd-list">
            {loading ? (
              <div className="ahd-empty">Carregando chamados...</div>
            ) : filtered.length ? (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  className={`ahd-item ${String(ticket.id) === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(String(ticket.id))}
                >
                  <div className="ahd-item-top">
                    <b>{ticket.title}</b>
                    <small className={`priority ${ticket.priority}`}>{ticket.priority === "alta" ? "Alta" : "Normal"}</small>
                  </div>
                  <span>
                    {ticket.userName} · {ticket.userSchool || "Escola não informada"} · {CATEGORY_LABEL[ticket.category]}
                  </span>
                  <div className="ahd-item-bottom">
                    <small className={`status status-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</small>
                    <small>{toDisplayDate(ticket.updatedAt)}</small>
                  </div>
                </button>
              ))
            ) : (
              <div className="ahd-empty">Sem chamados para os filtros atuais.</div>
            )}
          </aside>

          <section className="ahd-detail">
            {selected ? (
              <>
                <div className="ahd-ticket-header">
                  <div>
                    <b>{selected.title}</b>
                    <span>
                      {selected.userName} · {selected.userSchool || "Escola não informada"} · {CATEGORY_LABEL[selected.category]} · Criado em {toDisplayDate(selected.createdAt)}
                    </span>
                  </div>
                  <select
                    value={selected.status}
                    onChange={(e) => handleStatusChange(e.target.value as HelpdeskTicketStatus)}
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em-atendimento">Em atendimento</option>
                    <option value="aguardando-usuario">Aguardando usuário</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                </div>

                <div className="ahd-messages">
                  {selected.messages.map((message) => (
                    <div key={message.id} className={`ahd-msg ahd-msg-${message.sender}`}>
                      <p>{message.content}</p>
                      <span>{toDisplayDate(message.createdAt)}</span>
                    </div>
                  ))}
                </div>

                <form className="ahd-reply" onSubmit={handleReply}>
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Responder chamado como atendimento"
                  />
                  <button type="submit">Responder</button>
                </form>

              </>
            ) : (
              <div className="ahd-empty">Selecione um chamado para atender.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminHelpdeskPage;
