import React, { useEffect, useMemo, useState } from "react";
import AdminMenubar from "../components/admin/menubar";
import CoordinatorMenubar from "../components/coordinator/menubar";
import ConsultantMenubar from "../components/consultant/menubar";
import { checkSession } from "../controllers/user/checkSession.controller";
import { listContracts, type TContractItem } from "../controllers/contract/listContracts.controller";
import { createContract } from "../controllers/contract/createContract.controller";
import { updateContract } from "../controllers/contract/updateContract.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listUsersAdmin } from "../controllers/user/listUsersAdmin.controller";
import { findUser } from "../controllers/user/findUser.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";

import "../style/adminDash.css";
import "../style/contractsPage.css";

type TRole = "consultant" | "coordinator" | "admin";

type TCoordinator = {
  id: number;
  firstName: string;
  lastName: string;
  management?: string | null;
};

type TConsultant = {
  id: number;
  firstName: string;
  lastName: string;
  management?: string | null;
};

type TOverviewData = {
  unreadNotifications: number;
};

type TFormMode = "create" | "edit";

type TContractForm = {
  id?: number;
  name: string;
  coordinatorId: number | "";
  consultantIds: number[];
  studentsCount: number;
  teachersCount: number;
  booksCount: number;
};

function emptyForm(): TContractForm {
  return {
    name: "",
    coordinatorId: "",
    consultantIds: [],
    studentsCount: 0,
    teachersCount: 0,
    booksCount: 0,
  };
}

function ContractsPage() {
  const isAdminPanel = window.location.pathname.startsWith("/admin");
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator");

  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
  const [role, setRole] = useState<TRole | null>(null);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [contracts, setContracts] = useState<TContractItem[]>([]);
  const [consultants, setConsultants] = useState<TConsultant[]>([]);
  const [coordinators, setCoordinators] = useState<TCoordinator[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TFormMode>("create");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TContractForm>(emptyForm());

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const coordinatorLabelById = useMemo(() => {
    const map = new Map<number, string>();
    coordinators.forEach((item) => map.set(item.id, `${item.firstName} ${item.lastName}`.trim()));
    return map;
  }, [coordinators]);

  const selectedCoordinatorManagement = useMemo(() => {
    const coordinatorId = Number(form.coordinatorId);
    if (!Number.isFinite(coordinatorId) || coordinatorId <= 0) return "";
    const coordinator = coordinators.find((item) => item.id === coordinatorId);
    return String(coordinator?.management || "").trim();
  }, [coordinators, form.coordinatorId]);

  const filteredConsultants = useMemo(() => {
    if (!selectedCoordinatorManagement) {
      return role === "coordinator" ? consultants : [];
    }
    return consultants.filter(
      (item) => String(item.management || "").trim() === selectedCoordinatorManagement
    );
  }, [consultants, role, selectedCoordinatorManagement]);

  async function loadData() {
    setLoading(true);
    try {
      const [session, overview, contractsData, consultantsData] = await Promise.all([
        checkSession(),
        getOverviewData(),
        listContracts(),
        listConsultants(),
      ]);

      const userRole = session?.session?.role as TRole;
      const userId = Number(session?.session?.sub) || null;

      setRole(userRole);
      setSessionUserId(userId);
      setOverviewData(overview);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setConsultants(Array.isArray(consultantsData) ? consultantsData : []);

      if (userRole === "admin") {
        const coordinatorsResponse = await listUsersAdmin({ role: "coordinator", page: 1, pageSize: 500 });
        const items = Array.isArray(coordinatorsResponse?.items) ? coordinatorsResponse.items : [];
        setCoordinators(
          items
            .map((item: any) => ({
              id: Number(item?.id),
              firstName: String(item?.firstName || ""),
              lastName: String(item?.lastName || ""),
              management: item?.management ? String(item.management) : null,
            }))
            .filter((item: TCoordinator) => item.id > 0)
        );
      } else if (userRole === "coordinator" && userId) {
        const me = await findUser(userId);
        setCoordinators([
          {
            id: Number(me?.id) || userId,
            firstName: String(me?.firstName || "Coordenador"),
            lastName: String(me?.lastName || ""),
            management: me?.management ? String(me.management) : null,
          },
        ]);
      } else {
        setCoordinators([]);
      }
    } catch (error) {
      console.error("Error loading contracts page:", error);
      setContracts([]);
      setConsultants([]);
      setCoordinators([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function openCreate() {
    setModalMode("create");
    setForm({
      name: "",
      coordinatorId: role === "coordinator" ? Number(sessionUserId) || "" : "",
      consultantIds: [],
      studentsCount: 0,
      teachersCount: 0,
      booksCount: 0,
    });
    setModalOpen(true);
  }

  function openEdit(contract: TContractItem) {
    setModalMode("edit");
    setForm({
      id: contract.id,
      name: String(contract.name || ""),
      coordinatorId: contract.coordinatorId,
      consultantIds: contract.consultantIds,
      studentsCount: Number(contract.studentsCount) || 0,
      teachersCount: Number(contract.teachersCount) || 0,
      booksCount: Number(contract.booksCount) || 0,
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setForm(emptyForm());
  }

  function toggleConsultant(consultantId: number) {
    setForm((prev) => {
      const exists = prev.consultantIds.includes(consultantId);
      return {
        ...prev,
        consultantIds: exists
          ? prev.consultantIds.filter((id) => id !== consultantId)
          : [...prev.consultantIds, consultantId],
      };
    });
  }

  useEffect(() => {
    if (!modalOpen) return;
    const allowedIds = new Set(filteredConsultants.map((item) => item.id));
    setForm((prev) => ({
      ...prev,
      consultantIds: prev.consultantIds.filter((id) => allowedIds.has(id)),
    }));
  }, [filteredConsultants, modalOpen]);

  async function submit() {
    if (!form.consultantIds.length) {
      setToast({ type: "error", text: "Selecione pelo menos um consultor." });
      return;
    }
    if (!String(form.name || "").trim()) {
      setToast({ type: "error", text: "Informe o nome do contrato." });
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: any = {
          name: form.name.trim(),
          consultantIds: form.consultantIds,
          studentsCount: form.studentsCount,
          teachersCount: form.teachersCount,
          booksCount: form.booksCount,
        };
        if (role === "admin") payload.coordinatorId = Number(form.coordinatorId) || 0;
        await createContract(payload);
        setToast({ type: "success", text: "Contrato criado com sucesso." });
      } else if (form.id) {
        const payload: any = {
          id: form.id,
          name: form.name.trim(),
          consultantIds: form.consultantIds,
          studentsCount: form.studentsCount,
          teachersCount: form.teachersCount,
          booksCount: form.booksCount,
        };
        if (role === "admin") payload.coordinatorId = Number(form.coordinatorId) || 0;
        await updateContract(payload);
        setToast({ type: "success", text: "Contrato atualizado com sucesso." });
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Error saving contract:", error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Não foi possível salvar o contrato.";
      setToast({ type: "error", text: String(message) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-dashboard-container">
        {isAdminPanel ? (
          <AdminMenubar />
        ) : isCoordinatorPanel ? (
          <CoordinatorMenubar />
        ) : (
          <ConsultantMenubar notificationCount={Number(overviewData?.unreadNotifications)} />
        )}

        <div className="admin-dashboard-wrapper contracts-page">
          <div className="contracts-header">
            <div>
              <b>Contratos</b>
              <span>Gestão centralizada de coordenador e consultores por contrato.</span>
            </div>
            <button type="button" className="contracts-new-button" onClick={openCreate}>
              Novo contrato
            </button>
          </div>

          <div className="contracts-card">
            <div className="contracts-card-header">
              <b>Lista de Contratos</b>
            </div>
            {loading ? (
              <div className="contracts-empty">Carregando contratos...</div>
            ) : !contracts.length ? (
              <div className="contracts-empty">Nenhum contrato encontrado.</div>
            ) : (
              <div className="contracts-table-wrap">
                <table className="contracts-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Coordenador</th>
                      <th>Gerência</th>
                      <th>Alunos</th>
                      <th>Professores</th>
                      <th>Livros</th>
                      <th>Consultores</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((item) => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.coordinatorName || coordinatorLabelById.get(item.coordinatorId) || `#${item.coordinatorId}`}</td>
                        <td>{item.coordinatorManagement || "-"}</td>
                        <td>{Number(item.studentsCount) || 0}</td>
                        <td>{Number(item.teachersCount) || 0}</td>
                        <td>{Number(item.booksCount) || 0}</td>
                        <td>{item.consultants.map((c) => `${c.firstName} ${c.lastName}`).join(", ") || "-"}</td>
                        <td>
                          <button type="button" className="contracts-edit-button" onClick={() => openEdit(item)}>
                            Editar
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
        <div className="contracts-modal-overlay" onClick={closeModal}>
          <div className="contracts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="contracts-modal-header">
              <div>
                <b>{modalMode === "create" ? "Novo contrato" : "Editar contrato"}</b>
                <span>Defina coordenador e consultores vinculados.</span>
              </div>
              <button type="button" className="contracts-close-button" onClick={closeModal}>×</button>
            </div>

            <div className="contracts-modal-body">
              <div className="contracts-form-grid">
                <label className="contracts-field contracts-field-full">
                  <span>Nome do contrato*</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex.: Contrato Rede Norte 2026"
                  />
                </label>
                <label className="contracts-field">
                  <span>Coordenador*</span>
                  <select
                    value={form.coordinatorId}
                    disabled={role === "coordinator"}
                    onChange={(e) => setForm((prev) => ({ ...prev, coordinatorId: Number(e.target.value) || "" }))}
                  >
                    <option value="">Selecione um coordenador</option>
                    {coordinators.map((coordinator) => (
                      <option key={coordinator.id} value={coordinator.id}>
                        {coordinator.firstName} {coordinator.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="contracts-field">
                  <span>Quantitativo de alunos*</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.studentsCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, studentsCount: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </label>
                <label className="contracts-field">
                  <span>Quantitativo de professores*</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.teachersCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, teachersCount: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </label>
                <label className="contracts-field">
                  <span>Quantitativo de livros*</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.booksCount}
                    onChange={(e) => setForm((prev) => ({ ...prev, booksCount: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </label>
              </div>

              <div className="contracts-consultants-card">
                <div className="contracts-consultants-head">
                  <b>Consultores do contrato</b>
                </div>
                <div className="contracts-consultants">
                  {!filteredConsultants.length ? (
                    <span>Nenhum consultor disponível para a rede do coordenador selecionado.</span>
                  ) : null}
                  {filteredConsultants.map((consultant) => (
                    <label key={consultant.id}>
                      <input
                        type="checkbox"
                        checked={form.consultantIds.includes(consultant.id)}
                        onChange={() => toggleConsultant(consultant.id)}
                      />
                      <span>{consultant.firstName} {consultant.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="contracts-modal-footer">
              <button type="button" className="contracts-ghost-button" onClick={closeModal}>Fechar</button>
              <button type="button" className="contracts-primary-button" disabled={submitting} onClick={() => void submit()}>
                {submitting ? "Salvando..." : modalMode === "create" ? "Criar contrato" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={`contracts-toast ${toast.type}`}>{toast.text}</div> : null}
    </>
  );
}

export default ContractsPage;
