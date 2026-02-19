import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import CoordinatorMenubar from "../components/coordinator/menubar";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { findUser } from "../controllers/user/findUser.controller";
import { createUserAdmin } from "../controllers/user/createUserAdmin.controller";
import { updateUserAdmin } from "../controllers/user/updateUserAdmin.controller";
import { setUserStatusAdmin } from "../controllers/user/setUserStatusAdmin.controller";
import { setUserVacationModeAdmin } from "../controllers/user/setUserVacationModeAdmin.controller";
import { getCookies } from "../controllers/misc/cookies.controller";

import iconDots from "../img/adminUsers/dots-vertical.svg";

import "../style/adminDash.css";
import "../style/collegesPage.css";
import "../style/coordinatorConsultantsPage.css";

type TConsultant = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  management?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  vacationMode?: boolean;
  vacationMessage?: string | null;
  vacationStartAt?: string | null;
  createdAt?: string;
};

type TModalMode = "view" | "edit" | "create";

function CoordinatorConsultantsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consultants, setConsultants] = useState<TConsultant[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "vacation">("all");
  const [openActionsId, setOpenActionsId] = useState<number | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLElement | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TModalMode>("view");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    management: "",
    isActive: true,
    vacationMode: false,
    vacationMessage: "",
    password: "",
  });
  const [originalForm, setOriginalForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    management: "",
    isActive: true,
    vacationMode: false,
    vacationMessage: "",
  });
  const coordinatorManagement = String(getCookies("userData")?.management || "");

  async function loadConsultants() {
    setLoading(true);
    try {
      const data = await listConsultants();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConsultants();
  }, []);

  useEffect(() => {
    if (openActionsId === null) return;

    const updatePosition = () => {
      const button = actionsButtonRef.current;
      const menu = actionsMenuRef.current;
      if (!button || !menu) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = menu.offsetWidth || 190;
      const menuHeight = menu.offsetHeight || 120;
      const viewportPadding = 8;

      let top = rect.bottom + 8;
      let left = rect.right;

      if (left - menuWidth < viewportPadding) {
        left = rect.left + menuWidth;
      }
      if (top + menuHeight > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, rect.top - menuHeight - 8);
      }

      setActionsMenuPos({ top, left });
    };

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (actionsMenuRef.current?.contains(target)) return;
      if (actionsButtonRef.current?.contains(target)) return;
      setOpenActionsId(null);
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenActionsId(null);
    }

    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openActionsId]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return consultants.filter((consultant) => {
      const fullName = `${consultant.firstName || ""} ${consultant.lastName || ""}`.trim().toLowerCase();
      const email = String(consultant.email || "").toLowerCase();
      const management = String(consultant.management || "").toLowerCase();

      if (normalizedSearch) {
        const hit = fullName.includes(normalizedSearch) || email.includes(normalizedSearch) || management.includes(normalizedSearch);
        if (!hit) return false;
      }

      if (statusFilter === "active") return Boolean(consultant.isActive) && !consultant.vacationMode;
      if (statusFilter === "inactive") return !consultant.isActive;
      if (statusFilter === "vacation") return Boolean(consultant.vacationMode);

      return true;
    });
  }, [consultants, search, statusFilter]);

  const summary = useMemo(() => {
    const total = consultants.length;
    const active = consultants.filter((item) => item.isActive && !item.vacationMode).length;
    const inactive = consultants.filter((item) => !item.isActive).length;
    const vacation = consultants.filter((item) => item.vacationMode).length;
    return { total, active, inactive, vacation };
  }, [consultants]);

  function formatMetric(value?: number) {
    return Number(value ?? 0).toLocaleString("pt-BR");
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitting(false);
  }

  function openCreateModal() {
    setOpenActionsId(null);
    setModalMode("create");
    setForm({
      id: 0,
      firstName: "",
      lastName: "",
      email: "",
      management: coordinatorManagement,
      isActive: true,
      vacationMode: false,
      vacationMessage: "",
      password: "",
    });
    setOriginalForm({
      firstName: "",
      lastName: "",
      email: "",
      management: coordinatorManagement,
      isActive: true,
      vacationMode: false,
      vacationMessage: "",
    });
    setModalOpen(true);
  }

  async function openModal(mode: TModalMode, consultantId: number) {
    setOpenActionsId(null);
    setModalMode(mode);
    setModalOpen(true);

    try {
      const user = await findUser(String(consultantId));
      const data = user?.data ?? user;
      setForm({
        id: Number(data.id || consultantId),
        firstName: String(data.firstName || ""),
        lastName: String(data.lastName || ""),
        email: String(data.email || ""),
        management: String(data.management || ""),
        isActive: Boolean(data.isActive),
        vacationMode: Boolean(data.vacationMode),
        vacationMessage: String(data.vacationMessage || ""),
        password: "",
      });
      setOriginalForm({
        firstName: String(data.firstName || ""),
        lastName: String(data.lastName || ""),
        email: String(data.email || ""),
        management: String(data.management || ""),
        isActive: Boolean(data.isActive),
        vacationMode: Boolean(data.vacationMode),
        vacationMessage: String(data.vacationMessage || ""),
      });
    } catch (error) {
      console.error("Error loading consultant:", error);
      closeModal();
      setIsError(true);
      setMessage("Não foi possível carregar os dados do consultor.");
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
          setIsError(true);
          setMessage("Preencha nome, sobrenome e e-mail.");
          return;
        }

        await createUserAdmin({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password.trim() || undefined,
          role: "consultant",
          isActive: form.isActive,
          management: form.management.trim() || null,
        });

        setIsError(false);
        setMessage("Consultor criado com sucesso.");
        closeModal();
        await loadConsultants();
        return;
      }

      if (modalMode !== "edit") return;

      const patch: Record<string, unknown> = {};
      if (form.firstName.trim() !== originalForm.firstName.trim()) patch.firstName = form.firstName.trim();
      if (form.lastName.trim() !== originalForm.lastName.trim()) patch.lastName = form.lastName.trim();
      if (form.email.trim() !== originalForm.email.trim()) patch.email = form.email.trim();

      if (Object.keys(patch).length) {
        await updateUserAdmin(form.id, patch);
      }

      if (form.isActive !== originalForm.isActive) {
        await setUserStatusAdmin(form.id, form.isActive ? "active" : "inactive");
      }

      if (
        form.vacationMode !== originalForm.vacationMode ||
        (form.vacationMode && form.vacationMessage.trim() !== originalForm.vacationMessage.trim())
      ) {
        await setUserVacationModeAdmin(
          form.id,
          form.vacationMode,
          form.vacationMode ? form.vacationMessage.trim() || "Aproveite seu descanso, nos vemos na volta!" : ""
        );
      }

      setIsError(false);
      setMessage("Consultor atualizado com sucesso.");
      closeModal();
      await loadConsultants();
    } catch (error) {
      console.error("Error updating consultant:", error);
      setIsError(true);
      setMessage("Não foi possível atualizar o consultor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-dashboard-container">
        <CoordinatorMenubar />
        <div className="admin-dashboard-wrapper colleges-page">
          <div className="colleges-header">
            <div>
              <b>Gestão de Consultores</b>
              <span>Listagem com filtros de status e controle de modo férias por regional.</span>
            </div>
          </div>

          <div className="coord-consultants-kpi-grid">
            <div className="coord-consultants-kpi-card">
              <span>Total de Consultores</span>
              <b>{formatMetric(summary.total)}</b>
            </div>
            <div className="coord-consultants-kpi-card">
              <span>Consultores Ativos</span>
              <b>{formatMetric(summary.active)}</b>
            </div>
            <div className="coord-consultants-kpi-card">
              <span>Consultores Inativos</span>
              <b>{formatMetric(summary.inactive)}</b>
            </div>
            <div className="coord-consultants-kpi-card">
              <span>Modo Férias Ativado</span>
              <b>{formatMetric(summary.vacation)}</b>
            </div>
          </div>

          <div className="colleges-card">
            <div className="colleges-card-header" style={{ gap: 10, alignItems: "center", display: "flex", justifyContent: "space-between" }}>
              <b>Lista de Consultores</b>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar consultor"
                  style={{ height: 36, borderRadius: 8, border: "1px solid #d0d7e2", padding: "0 10px" }}
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                  style={{ height: 36, borderRadius: 8, border: "1px solid #d0d7e2", padding: "0 10px" }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="vacation">Modo férias</option>
                </select>
                <button type="button" className="colleges-primary-button" onClick={openCreateModal}>
                  Novo consultor
                </button>
              </div>
            </div>

            {loading ? (
              <div className="colleges-empty">Carregando consultores...</div>
            ) : !filtered.length ? (
              <div className="colleges-empty">Nenhum consultor encontrado.</div>
            ) : (
              <div className="colleges-table-wrap">
                <table className="colleges-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Gerência</th>
                      <th>Status</th>
                      <th>Modo Férias</th>
                      <th>Criado Em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((consultant) => (
                      <tr key={consultant.id}>
                        <td>{consultant.firstName} {consultant.lastName}</td>
                        <td>{consultant.email || "-"}</td>
                        <td>{consultant.management || "-"}</td>
                        <td>{consultant.isActive ? "Ativo" : "Inativo"}</td>
                        <td>{consultant.vacationMode ? "Ativado" : "Desativado"}</td>
                        <td>{consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString("pt-BR") : "-"}</td>
                        <td className="colleges-actions-cell">
                          <button
                            type="button"
                            title="Ações"
                            aria-haspopup="menu"
                            aria-expanded={openActionsId === consultant.id}
                            className="colleges-actions-btn"
                            onClick={(event) => {
                              if (openActionsId === consultant.id) {
                                setOpenActionsId(null);
                                return;
                              }
                              actionsButtonRef.current = event.currentTarget;
                              setOpenActionsId(consultant.id);
                            }}
                          >
                            <img src={iconDots} alt="" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="colleges-modal-overlay" onClick={closeModal}>
          <div className="colleges-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="colleges-modal-header">
              <div>
                <b>{modalMode === "create" ? "Novo consultor" : modalMode === "edit" ? "Editar consultor" : "Visualizar consultor"}</b>
                {modalMode === "view" ? <span>Dados do consultor em modo somente leitura.</span> : null}
              </div>
              <div className="colleges-modal-header-actions">
                {modalMode === "view" ? (
                  <button type="button" className="colleges-ghost-button" onClick={() => setModalMode("edit")}>Editar</button>
                ) : null}
                <button type="button" className="colleges-close-button" onClick={closeModal}>×</button>
              </div>
            </div>

            <div className="colleges-modal-body">
              <div className="colleges-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <label>
                  <span>Nome</span>
                  <input
                    type="text"
                    value={form.firstName}
                    disabled={modalMode === "view"}
                    onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Sobrenome</span>
                  <input
                    type="text"
                    value={form.lastName}
                    disabled={modalMode === "view"}
                    onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="text"
                    value={form.email}
                    disabled={modalMode === "view"}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Gerência</span>
                  <input
                    type="text"
                    value={form.management}
                    disabled
                  />
                </label>
                {modalMode === "create" ? (
                  <label>
                    <span>Senha inicial (opcional)</span>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </label>
                ) : null}
                <label>
                  <span>Status</span>
                  <select
                    value={String(form.isActive)}
                    disabled={modalMode === "view"}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.value === "true" }))}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
                <label>
                  <span>Modo férias</span>
                  <select
                    value={String(form.vacationMode)}
                    disabled={modalMode === "view"}
                    onChange={(event) => setForm((prev) => ({ ...prev, vacationMode: event.target.value === "true" }))}
                  >
                    <option value="false">Desativado</option>
                    <option value="true">Ativado</option>
                  </select>
                </label>
                {form.vacationMode ? (
                  <label style={{ gridColumn: "1 / -1" }}>
                    <span>Mensagem de férias</span>
                    <textarea
                      value={form.vacationMessage}
                      disabled={modalMode === "view"}
                      onChange={(event) => setForm((prev) => ({ ...prev, vacationMessage: event.target.value }))}
                      rows={4}
                    />
                  </label>
                ) : null}
              </div>
            </div>

            <div className="colleges-modal-footer">
              <button type="button" className="colleges-ghost-button" onClick={closeModal}>Fechar</button>
              {modalMode === "edit" || modalMode === "create" ? (
                <button type="button" className="colleges-primary-button" disabled={submitting} onClick={() => void submit()}>
                  {submitting ? "Salvando..." : modalMode === "create" ? "Criar consultor" : "Salvar alterações"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {openActionsId !== null
        ? createPortal(
            <div
              ref={actionsMenuRef}
              className="colleges-actions-menu-portal"
              role="menu"
              style={{ top: actionsMenuPos.top, left: actionsMenuPos.left }}
            >
              <button type="button" role="menuitem" className="colleges-actions-item" onClick={() => void openModal("view", openActionsId)}>
                Visualizar cadastro
              </button>
              <button type="button" role="menuitem" className="colleges-actions-item" onClick={() => void openModal("edit", openActionsId)}>
                Editar cadastro
              </button>
            </div>,
            document.body
          )
        : null}

      {message ? (
        <div className={`admin-users-toast ${isError ? "error" : ""}`} style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1300 }}>
          {message}
        </div>
      ) : null}
    </>
  );
}

export default CoordinatorConsultantsPage;
