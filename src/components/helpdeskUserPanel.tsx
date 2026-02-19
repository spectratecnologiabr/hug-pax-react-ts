import React, { useEffect, useMemo, useState } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";
import {
  appendHelpdeskMessage,
  createHelpdeskTicket,
  HelpdeskTicket,
  HelpdeskTicketCategory,
  HelpdeskTicketStatus,
  listHelpdeskTickets,
  updateHelpdeskTicketStatus,
} from "../controllers/helpdesk/helpdeskLocal.controller";
import "../style/helpdeskUserPanel.css";

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

function toDisplayDate(raw: string) {
  return new Date(raw).toLocaleString("pt-BR");
}

function roleLabel(role?: string) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "admin") return "Administrador";
  if (normalized === "coordinator") return "Coordenador";
  if (normalized === "consultant") return "Consultor";
  if (normalized === "educator") return "Educador";
  return "Administrador";
}

function messageSenderLabel(message: HelpdeskTicket["messages"][number]) {
  if (message.sender === "agent") {
    const name = String(message.createdByName || "").trim();
    const role = roleLabel(message.createdByRole);
    return name ? `${name} (${role})` : role;
  }
  if (message.sender === "system") return "Sistema";
  return "Você";
}

type Props = {
  isPopup?: boolean;
  onClose?: () => void;
};

function HelpdeskUserPanel({ isPopup = false, onClose }: Props) {
  const userRole = String(getCookies("userData")?.role || "");
  const canChangeStatus = userRole === "admin";
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HelpdeskTicketCategory>("suporte-tecnico");
  const [description, setDescription] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => String(ticket.id) === selectedId) || null,
    [selectedId, tickets]
  );
  const isResolvedForEducator = userRole === "educator" && selectedTicket?.status === "resolvido";
  const canSendMessage = Boolean(selectedTicket) && !isResolvedForEducator;

  async function refreshTickets(nextSelectedId?: string) {
    const updated: HelpdeskTicket[] = await listHelpdeskTickets();
    setTickets(updated);
    if (!updated.length) {
      setSelectedId("");
      return;
    }
    const keepId = nextSelectedId || selectedId || String(updated[0].id);
    const exists = updated.some((ticket) => String(ticket.id) === String(keepId));
    setSelectedId(String(exists ? keepId : updated[0].id));
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const updated = await listHelpdeskTickets();
        if (!mounted) return;
        setTickets(updated);
        if (updated.length) {
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

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const created = await createHelpdeskTicket({ title, category, description });
    setTitle("");
    setDescription("");
    setCategory("suporte-tecnico");
    if (created?.id) {
      await refreshTickets(String(created.id));
      return;
    }
    await refreshTickets();
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim() || !canSendMessage) return;
    await appendHelpdeskMessage(selectedTicket.id, newMessage, "user");
    setNewMessage("");
    await refreshTickets(String(selectedTicket.id));
  }

  async function handleStatusChange(status: HelpdeskTicketStatus) {
    if (!selectedTicket || !canChangeStatus) return;
    await updateHelpdeskTicketStatus(selectedTicket.id, status);
    await refreshTickets(String(selectedTicket.id));
  }

  return (
    <div className={`helpdesk-user-panel ${isPopup ? "popup" : ""}`}>
      <div className="helpdesk-user-header">
        <div>
          <b>Central de Helpdesk</b>
          <span>Abra chamados e acompanhe o atendimento.</span>
        </div>
        {isPopup && (
          <button type="button" className="helpdesk-user-close" onClick={onClose} aria-label="Fechar helpdesk">
            x
          </button>
        )}
      </div>

      <div className="helpdesk-user-grid">
        <aside className="helpdesk-user-col">
          <form className="helpdesk-user-form" onSubmit={handleCreateTicket}>
            <input placeholder="Título do chamado" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <select value={category} onChange={(e) => setCategory(e.target.value as HelpdeskTicketCategory)}>
              <option value="erro-em-aula">Erro em Aula (Prioridade Alta)</option>
              <option value="suporte-tecnico">Suporte Técnico</option>
              <option value="suporte-pedagogico">Suporte Pedagógico</option>
              <option value="duvida-administrativa">Dúvida Administrativa</option>
            </select>
            <textarea
              rows={3}
              placeholder="Descreva o problema"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <button type="submit">Criar ticket</button>
          </form>

          <div className="helpdesk-user-tickets">
            {loading ? (
              <p className="helpdesk-user-empty">Carregando...</p>
            ) : (
              tickets.length ? (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`helpdesk-user-ticket ${String(ticket.id) === selectedId ? "active" : ""}`}
                    onClick={() => setSelectedId(String(ticket.id))}
                  >
                    <b>{ticket.title}</b>
                    <span>{CATEGORY_LABEL[ticket.category]}</span>
                    <div className="helpdesk-user-tags">
                      <small className={`priority ${ticket.priority}`}>{ticket.priority === "alta" ? "Alta" : "Normal"}</small>
                      <small className={`status status-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</small>
                    </div>
                  </button>
                ))
              ) : (
                <p className="helpdesk-user-empty">Nenhum ticket ainda.</p>
              )
            )}
          </div>
        </aside>

        <section className="helpdesk-user-chat">
          {selectedTicket ? (
            <>
              <div className="helpdesk-user-chat-header">
                <div>
                  <b>{selectedTicket.title}</b>
                  <span>
                    {CATEGORY_LABEL[selectedTicket.category]} · {selectedTicket.userName}
                    {selectedTicket.userSchool ? ` · ${selectedTicket.userSchool}` : ""}
                  </span>
                </div>
                {canChangeStatus ? (
                  <select
                    className="helpdesk-status-select"
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as HelpdeskTicketStatus)}
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em-atendimento">Em atendimento</option>
                    <option value="aguardando-usuario">Aguardando usuário</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                ) : (
                  <small className={`status status-${selectedTicket.status}`}>{STATUS_LABEL[selectedTicket.status]}</small>
                )}
              </div>

              <div className="helpdesk-user-messages">
                {selectedTicket.messages.map((message) => (
                  <div key={message.id} className={`msg msg-${message.sender}`}>
                    <small className="msg-sender">{messageSenderLabel(message)}</small>
                    <p>{message.content}</p>
                    <span>{toDisplayDate(message.createdAt)}</span>
                  </div>
                ))}
              </div>

              <form className="helpdesk-user-send" onSubmit={handleSendMessage}>
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={canSendMessage ? "Escreva sua mensagem..." : "Chamado resolvido. Aguarde reabertura pelo admin."}
                  disabled={!canSendMessage}
                />
                <button type="submit" disabled={!canSendMessage}>Enviar</button>
              </form>
            </>
          ) : (
            <div className="helpdesk-user-empty-state">Selecione um ticket para conversar.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default HelpdeskUserPanel;
