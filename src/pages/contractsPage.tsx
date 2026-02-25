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
};

type TConsultant = {
  id: number;
  firstName: string;
  lastName: string;
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
};

function emptyForm(): TContractForm {
  return {
    name: "",
    coordinatorId: "",
    consultantIds: [],
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
        const payload: any = { name: form.name.trim(), consultantIds: form.consultantIds };
        if (role === "admin") payload.coordinatorId = Number(form.coordinatorId) || 0;
        await createContract(payload);
        setToast({ type: "success", text: "Contrato criado com sucesso." });
      } else if (form.id) {
        const payload: any = { id: form.id, name: form.name.trim(), consultantIds: form.consultantIds };
        if (role === "admin") payload.coordinatorId = Number(form.coordinatorId) || 0;
        await updateContract(payload);
        setToast({ type: "success", text: "Contrato atualizado com sucesso." });
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Error saving contract:", error);
      setToast({ type: "error", text: "Não foi possível salvar o contrato." });
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
                    placeholder="Ex.: Contrato Regional Norte 2026"
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
              </div>

              <div className="contracts-consultants-card">
                <div className="contracts-consultants-head">
                  <b>Consultores do contrato</b>
                </div>
                <div className="contracts-consultants">
                  {consultants.map((consultant) => (
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
