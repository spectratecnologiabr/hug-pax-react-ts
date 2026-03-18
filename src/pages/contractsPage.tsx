import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminMenubar from "../components/admin/menubar";
import CoordinatorMenubar from "../components/coordinator/menubar";
import ConsultantMenubar from "../components/consultant/menubar";
import { checkSession } from "../controllers/user/checkSession.controller";
import { listContracts, type TContractItem } from "../controllers/contract/listContracts.controller";
import { createContract } from "../controllers/contract/createContract.controller";
import { updateContract } from "../controllers/contract/updateContract.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { updateCollege } from "../controllers/college/updateCollege.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listUsersAdmin } from "../controllers/user/listUsersAdmin.controller";
import { findUser } from "../controllers/user/findUser.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { importContractsAdmin, type IImportContractsAdminResponse, type ImportContractsMode } from "../controllers/contract/importContractsAdmin.controller";

import "../style/adminDash.css";
import "../style/contractsPage.css";

type TRole = "consultant" | "coordinator" | "specialist_consultant" | "admin";

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
type TSchoolSearchItem = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  gee?: string;
  contractId?: number | null;
};

type TContractForm = {
  id?: number;
  name: string;
  address: string;
  zipCode: string;
  phone: string;
  cnpj: string;
  coordinatorId: number | "";
  consultantIds: number[];
  studentsCount: number;
  teachersCount: number;
  booksCount: number;
};

function emptyForm(): TContractForm {
  return {
    name: "",
    address: "",
    zipCode: "",
    phone: "",
    cnpj: "",
    coordinatorId: "",
    consultantIds: [],
    studentsCount: 0,
    teachersCount: 0,
    booksCount: 0,
  };
}

function isCoordinatorLike(role: string | null | undefined) {
  return role === "coordinator" || role === "specialist_consultant";
}

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatZipCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

function ContractsPage() {
  const isAdminPanel = window.location.pathname.startsWith("/admin");
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator");

  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
  const [role, setRole] = useState<TRole | null>(null);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [contracts, setContracts] = useState<TContractItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [consultants, setConsultants] = useState<TConsultant[]>([]);
  const [coordinators, setCoordinators] = useState<TCoordinator[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TFormMode>("create");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TContractForm>(emptyForm());

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [schoolSearchLoading, setSchoolSearchLoading] = useState(false);
  const [schoolSearchResults, setSchoolSearchResults] = useState<TSchoolSearchItem[]>([]);
  const [bindingSchoolId, setBindingSchoolId] = useState<number | null>(null);
  const [bindSchoolsModalOpen, setBindSchoolsModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importContractsBuffer, setImportContractsBuffer] = useState<Array<Record<string, unknown>>>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importMode, setImportMode] = useState<ImportContractsMode>("upsert");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<IImportContractsAdminResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
      return isCoordinatorLike(role) ? consultants : [];
    }
    return consultants.filter(
      (item) => String(item.management || "").trim() === selectedCoordinatorManagement
    );
  }, [consultants, role, selectedCoordinatorManagement]);

  const selectedContract = useMemo(() => {
    const contractId = Number(form.id);
    if (!Number.isFinite(contractId) || contractId <= 0) return null;
    return contracts.find((item) => Number(item.id) === contractId) ?? null;
  }, [contracts, form.id]);

  const normalizedSearchTerm = useMemo(() => String(searchTerm || "").trim().toLowerCase(), [searchTerm]);
  const normalizedSchoolSearchTerm = useMemo(() => String(schoolSearchTerm || "").trim(), [schoolSearchTerm]);

  const filteredContracts = useMemo(() => {
    if (!normalizedSearchTerm) return contracts;

    return contracts.filter((item) => {
      const consultantsLabel = item.consultants
        .map((c) => `${String(c.firstName || "").trim()} ${String(c.lastName || "").trim()}`.trim())
        .join(" ");
      const coordinatorLabel =
        String(item.coordinatorName || "").trim() ||
        String(coordinatorLabelById.get(item.coordinatorId) || "").trim();

      const searchable = [
        String(item.id || ""),
        String(item.name || ""),
        coordinatorLabel,
        String(item.coordinatorManagement || ""),
        consultantsLabel,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearchTerm);
    });
  }, [contracts, coordinatorLabelById, normalizedSearchTerm]);

  const totalPages = useMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(filteredContracts.length / pageSize));
  }, [filteredContracts.length, pageSize]);

  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredContracts.slice(start, start + pageSize);
  }, [filteredContracts, page, pageSize]);

  const selectedContractSchoolIds = useMemo(() => {
    const ids = new Set<number>();
    (selectedContract?.schools || []).forEach((school) => {
      const id = Number(school?.id);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    });
    return ids;
  }, [selectedContract]);

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
        const [coordinatorsResponse, specialistResponse] = await Promise.all([
          listUsersAdmin({ role: "coordinator", page: 1, pageSize: 500 }),
          listUsersAdmin({ role: "specialist_consultant", page: 1, pageSize: 500 }),
        ]);
        const coordinatorItems = Array.isArray(coordinatorsResponse?.items) ? coordinatorsResponse.items : [];
        const specialistItems = Array.isArray(specialistResponse?.items) ? specialistResponse.items : [];
        const items = [...coordinatorItems, ...specialistItems];
        const uniqueById = new Map<number, any>();
        items.forEach((item: any) => {
          const id = Number(item?.id);
          if (Number.isFinite(id) && id > 0) uniqueById.set(id, item);
        });
        setCoordinators(
          Array.from(uniqueById.values())
            .map((item: any) => ({
              id: Number(item?.id),
              firstName: String(item?.firstName || ""),
              lastName: String(item?.lastName || ""),
              management: item?.management ? String(item.management) : null,
            }))
            .filter((item: TCoordinator) => item.id > 0)
        );
      } else if (isCoordinatorLike(userRole) && userId) {
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

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  function openCreate() {
    setModalMode("create");
    setForm({
      name: "",
      address: "",
      zipCode: "",
      phone: "",
      cnpj: "",
      coordinatorId: isCoordinatorLike(role) ? Number(sessionUserId) || "" : "",
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
      address: String(contract.address || ""),
      zipCode: String(contract.zipCode || contract.zip_code || ""),
      phone: String(contract.phone || ""),
      cnpj: String(contract.cnpj || ""),
      coordinatorId: contract.coordinatorId,
      consultantIds: contract.consultantIds,
      studentsCount: Number(contract.studentsCount) || 0,
      teachersCount: Number(contract.teachersCount) || 0,
      booksCount: Number(contract.booksCount) || 0,
    });
    setModalOpen(true);
    setSchoolSearchTerm("");
    setSchoolSearchResults([]);
    setBindSchoolsModalOpen(false);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    setForm(emptyForm());
    setSchoolSearchTerm("");
    setSchoolSearchResults([]);
    setBindingSchoolId(null);
    setBindSchoolsModalOpen(false);
  }

  function openImportModal() {
    setImportModalOpen(true);
    setImportContractsBuffer([]);
    setImportFileName("");
    setImportMode("upsert");
    setImportSubmitting(false);
    setImportResult(null);
    setImportError(null);
  }

  function closeImportModal() {
    if (importSubmitting) return;
    setImportModalOpen(false);
    setImportContractsBuffer([]);
    setImportFileName("");
    setImportResult(null);
    setImportError(null);
  }

  function triggerImportFileSelect() {
    importFileRef.current?.click();
  }

  async function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportError(null);
    setImportResult(null);

    try {
      const parsedContracts = await parseContractsImportFile(file);
      if (!parsedContracts.length) {
        setImportContractsBuffer([]);
        setImportFileName(file.name);
        setImportError("Arquivo sem linhas válidas para importação.");
        return;
      }

      setImportContractsBuffer(parsedContracts);
      setImportFileName(file.name);
    } catch (error: any) {
      setImportContractsBuffer([]);
      setImportFileName(file.name);
      setImportError(String(error?.message ?? "Falha ao ler o arquivo de importação."));
    }
  }

  async function handleImportSubmit() {
    if (!importContractsBuffer.length) {
      setImportError("Selecione um arquivo CSV ou JSON com contratos antes de importar.");
      return;
    }

    setImportSubmitting(true);
    setImportError(null);

    try {
      const result = await importContractsAdmin({ contracts: importContractsBuffer, mode: importMode });
      setImportResult(result);
      await loadData();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? "Não foi possível concluir a importação.";
      setImportError(String(message));
    } finally {
      setImportSubmitting(false);
    }
  }

  function handleDownloadContractsTemplateCsv() {
    const csvTemplate = [
      "id;nome;cnpj;endereco;cep;telefone;coordinatorId;consultantIds;studentsCount;teachersCount;booksCount",
      ";Contrato Rede Norte 2026;12.345.678/0001-90;Rua Exemplo, 123;57000-000;(82) 99999-9999;15;21,22;1200;80;3000",
      "42;Contrato Rede Sul 2026;98.765.432/0001-11;Av. Central, 456;01000-000;(11) 98888-7777;18;31,35;900;60;1800"
    ].join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo-importacao-contratos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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

  useEffect(() => {
    if (!modalOpen || !bindSchoolsModalOpen || modalMode !== "edit" || !form.id) return;
    const term = normalizedSchoolSearchTerm;
    if (term.length < 2) {
      setSchoolSearchResults([]);
      setSchoolSearchLoading(false);
      return;
    }

    let alive = true;
    const timer = window.setTimeout(async () => {
      setSchoolSearchLoading(true);
      try {
        const response: any = await listColleges({ search: term, page: 1, pageSize: 20 });
        const payloadItems = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data?.items)
            ? response.data.items
            : Array.isArray(response)
              ? response
              : [];

        if (!alive) return;
        const normalized = payloadItems
          .map((item: any) => ({
            id: Number(item?.id),
            name: String(item?.name || ""),
            city: item?.city ? String(item.city) : undefined,
            state: item?.state ? String(item.state) : undefined,
            gee: item?.gee ? String(item.gee) : undefined,
            contractId: Number(item?.contractId ?? item?.contract_id) || null,
          }))
          .filter((item: TSchoolSearchItem) => item.id > 0 && item.name.trim().length > 0)
          .filter((item: TSchoolSearchItem) => !(Number(item.contractId) > 0));

        setSchoolSearchResults(normalized);
      } catch (error) {
        if (!alive) return;
        console.error("Erro ao buscar escolas para vínculo de contrato:", error);
        setSchoolSearchResults([]);
      } finally {
        if (alive) setSchoolSearchLoading(false);
      }
    }, 300);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [bindSchoolsModalOpen, form.id, modalMode, modalOpen, normalizedSchoolSearchTerm]);

  async function bindSchoolToContract(school: TSchoolSearchItem) {
    const contractId = Number(form.id);
    if (!Number.isFinite(contractId) || contractId <= 0) return;

    setBindingSchoolId(school.id);
    try {
      await updateCollege({ id: String(school.id), contractId });
      setToast({ type: "success", text: `Escola "${school.name}" vinculada ao contrato.` });
      setSchoolSearchResults((prev) =>
        prev.map((item) => (item.id === school.id ? { ...item, contractId } : item))
      );
      await loadData();
    } catch (error) {
      console.error("Erro ao vincular escola ao contrato:", error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        "Não foi possível vincular a escola ao contrato.";
      setToast({ type: "error", text: String(message) });
    } finally {
      setBindingSchoolId(null);
    }
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
        const payload: any = {
          name: form.name.trim(),
          address: String(form.address || "").trim() || null,
          zipCode: String(form.zipCode || "").trim() || null,
          phone: String(form.phone || "").trim() || null,
          cnpj: String(form.cnpj || "").trim() || null,
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
          address: String(form.address || "").trim() || null,
          zipCode: String(form.zipCode || "").trim() || null,
          phone: String(form.phone || "").trim() || null,
          cnpj: String(form.cnpj || "").trim() || null,
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
            <div className="contracts-header-actions">
              {isAdminPanel ? (
                <button type="button" className="contracts-ghost-button" onClick={openImportModal}>
                  Importar contratos
                </button>
              ) : null}
              <button type="button" className="contracts-new-button" onClick={openCreate}>
                Novo contrato
              </button>
            </div>
          </div>

          <div className="contracts-card">
            <div className="contracts-card-header">
              <b>Lista de Contratos</b>
              <input
                type="search"
                className="contracts-search-input"
                placeholder="Buscar por nome, ID, coordenador, gerência ou consultor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {loading ? (
              <div className="contracts-empty">Carregando contratos...</div>
            ) : !contracts.length ? (
              <div className="contracts-empty">Nenhum contrato encontrado.</div>
            ) : !filteredContracts.length ? (
              <div className="contracts-empty">Nenhum contrato encontrado para a busca informada.</div>
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
                    {paginatedContracts.map((item) => (
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
            {!loading && filteredContracts.length ? (
              <div className="contracts-list-footer">
                <span>Total: {filteredContracts.length} contrato(s)</span>
                <div className="contracts-list-footer-meta">
                  <div className="contracts-page-size-control">
                    <span>Por página</span>
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        const nextPageSize = Math.max(1, Number(event.target.value) || 25);
                        setPageSize(nextPageSize);
                        setPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="contracts-list-footer-nav">
                  <button
                    type="button"
                    className="contracts-ghost-button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                  >
                    Anterior
                  </button>
                  <span>Página {page} de {totalPages}</span>
                  <button
                    type="button"
                    className="contracts-ghost-button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            ) : null}
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
                <label className="contracts-field contracts-field-full">
                  <span>Endereço</span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Ex.: Rua Exemplo, 123 - Centro"
                  />
                </label>
                <label className="contracts-field">
                  <span>CEP</span>
                  <input
                    type="text"
                    value={form.zipCode}
                    inputMode="numeric"
                    onChange={(e) => setForm((prev) => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                    placeholder="Ex.: 12345-678"
                  />
                </label>
                <label className="contracts-field">
                  <span>Telefone</span>
                  <input
                    type="text"
                    value={form.phone}
                    inputMode="numeric"
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    placeholder="Ex.: (11) 99999-9999"
                  />
                </label>
                <label className="contracts-field">
                  <span>CNPJ</span>
                  <input
                    type="text"
                    value={form.cnpj}
                    inputMode="numeric"
                    onChange={(e) => setForm((prev) => ({ ...prev, cnpj: formatCnpj(e.target.value) }))}
                    placeholder="Ex.: 00.000.000/0001-00"
                  />
                </label>
                <label className="contracts-field">
                  <span>Coordenador*</span>
                  <select
                    value={form.coordinatorId}
                    disabled={isCoordinatorLike(role)}
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

              {modalMode === "edit" ? (
                <>
                  <div className="contracts-schools-card">
                    <div className="contracts-schools-head">
                      <b>Escolas vinculadas ao contrato</b>
                      <button
                        type="button"
                        className="contracts-primary-button"
                        onClick={() => setBindSchoolsModalOpen(true)}
                      >
                        Vincular escola
                      </button>
                    </div>
                    <div className="contracts-schools-table-wrap">
                      <table className="contracts-schools-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Cidade - UF</th>
                            <th>GEE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedContract?.schools || []).length ? (
                            (selectedContract?.schools || []).map((school) => (
                              <tr key={school.id}>
                                <td>{school.name || "-"}</td>
                                <td>{[school.city, school.state].filter(Boolean).join(" - ") || "-"}</td>
                                <td>{String(school.gee || "").trim() || "-"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3}>Nenhuma escola vinculada a este contrato.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
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

      {bindSchoolsModalOpen && modalOpen && modalMode === "edit" ? (
        <div className="contracts-inline-modal-overlay" onClick={() => setBindSchoolsModalOpen(false)}>
          <div className="contracts-inline-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="contracts-modal-header">
              <div>
                <b>Vincular escola ao contrato</b>
                <span>Busque a escola e faça a vinculação sem sair da edição.</span>
              </div>
              <button type="button" className="contracts-close-button" onClick={() => setBindSchoolsModalOpen(false)}>×</button>
            </div>
            <div className="contracts-modal-body">
              <div className="contracts-schools-bind-body">
                <input
                  type="search"
                  className="contracts-search-input"
                  placeholder="Buscar escola por nome..."
                  value={schoolSearchTerm}
                  onChange={(e) => setSchoolSearchTerm(e.target.value)}
                />
                {normalizedSchoolSearchTerm.length < 2 ? (
                  <div className="contracts-schools-bind-empty">Digite ao menos 2 caracteres para buscar.</div>
                ) : schoolSearchLoading ? (
                  <div className="contracts-schools-bind-empty">Buscando escolas...</div>
                ) : !schoolSearchResults.length ? (
                  <div className="contracts-schools-bind-empty">Nenhuma escola encontrada.</div>
                ) : (
                  <div className="contracts-schools-bind-results">
                    {schoolSearchResults.map((school) => {
                      return (
                        <div key={school.id} className="contracts-schools-bind-item">
                          <div>
                            <b>{school.name}</b>
                            <span>{[school.city, school.state].filter(Boolean).join(" - ") || "Cidade/UF não informado"}</span>
                          </div>
                          <button
                            type="button"
                            className="contracts-primary-button"
                            disabled={bindingSchoolId === school.id || selectedContractSchoolIds.has(school.id)}
                            onClick={() => void bindSchoolToContract(school)}
                          >
                            {bindingSchoolId === school.id ? "Vinculando..." : "Vincular"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="contracts-modal-footer">
              <button type="button" className="contracts-ghost-button" onClick={() => setBindSchoolsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {importModalOpen ? (
        <div className="contracts-modal-overlay" onClick={closeImportModal}>
          <div className="contracts-modal-card contracts-import-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="contracts-modal-header">
              <div>
                <b>Importação em massa de contratos</b>
                <span>Envie um arquivo CSV ou JSON para criar ou atualizar contratos.</span>
              </div>
              <button type="button" className="contracts-close-button" onClick={closeImportModal}>×</button>
            </div>
            <div className="contracts-modal-body">
              <label className="contracts-field" style={{ maxWidth: 360 }}>
                <span>Modo de importação</span>
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as ImportContractsMode)}
                  disabled={importSubmitting}
                >
                  <option value="upsert">Criar e atualizar (upsert)</option>
                  <option value="create">Somente criar novos</option>
                  <option value="update">Somente atualizar existentes</option>
                </select>
              </label>

              <div className="contracts-import-hint">
                Colunas suportadas: `id`, `nome`/`name`, `cnpj`, `endereco`, `cep`, `telefone`,
                `coordinatorId`/`coordinatorEmail`, `consultantIds`/`consultantEmails`,
                `studentsCount`, `teachersCount`, `booksCount`.
              </div>

              <input
                ref={importFileRef}
                type="file"
                accept=".csv,.json,text/csv,application/json"
                style={{ display: "none" }}
                onChange={handleImportFileChange}
              />

              <div className="contracts-import-actions">
                <button type="button" className="contracts-ghost-button" onClick={triggerImportFileSelect} disabled={importSubmitting}>
                  Selecionar arquivo
                </button>
                <button type="button" className="contracts-ghost-button" onClick={handleDownloadContractsTemplateCsv} disabled={importSubmitting}>
                  Baixar modelo CSV
                </button>
              </div>

              {importFileName ? (
                <div className="contracts-import-meta">
                  <b>Arquivo:</b> {importFileName}
                </div>
              ) : null}

              {importContractsBuffer.length > 0 ? (
                <div className="contracts-import-meta">
                  <b>Linhas prontas para importar:</b> {importContractsBuffer.length}
                </div>
              ) : null}

              {importError ? <div className="contracts-inline-error">{importError}</div> : null}

              {importResult ? (
                <div className="contracts-import-result">
                  <div className="contracts-import-summary">
                    <span>Total: {importResult.summary.total}</span>
                    <span>Criados: {importResult.summary.created}</span>
                    <span>Atualizados: {importResult.summary.updated}</span>
                    <span>Falhas: {importResult.summary.failed}</span>
                  </div>

                  {importResult.summary.failed > 0 ? (
                    <div className="contracts-import-failures">
                      {importResult.results
                        .filter((item) => !item.success)
                        .slice(0, 10)
                        .map((item) => (
                          <div key={`${item.row}-${item.name ?? "sem-nome"}`} className="contracts-import-failure-row">
                            Linha {item.row} ({item.name ?? "sem nome"}): {item.message ?? "Erro"}
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="contracts-modal-footer">
              <button type="button" className="contracts-ghost-button" onClick={closeImportModal} disabled={importSubmitting}>
                Fechar
              </button>
              <button
                type="button"
                className="contracts-primary-button"
                onClick={() => void handleImportSubmit()}
                disabled={importSubmitting || importContractsBuffer.length === 0}
              >
                {importSubmitting ? "Importando..." : "Importar agora"}
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

async function parseContractsImportFile(file: File): Promise<Array<Record<string, unknown>>> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const text = await file.text();
  if (!text.trim()) throw new Error("Arquivo vazio.");

  if (ext === "json") {
    const parsed = JSON.parse(text);
    const contracts = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.contracts) ? parsed.contracts : [];
    if (!Array.isArray(contracts)) throw new Error("JSON inválido. Esperado array de contratos.");
    return contracts as Array<Record<string, unknown>>;
  }

  if (ext !== "csv" && ext !== "txt") {
    throw new Error("Formato inválido. Use arquivo .csv ou .json.");
  }

  return parseCsvContracts(text);
}

function parseCsvContracts(text: string): Array<Record<string, unknown>> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) throw new Error("CSV inválido. Informe cabeçalho + pelo menos uma linha.");

  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const separator = detectCsvSeparator(headerLine);
  const headers = parseCsvLine(headerLine, separator).map(normalizeContractImportHeader);

  if (!headers.length) throw new Error("Cabeçalho do CSV inválido.");

  const contracts: Array<Record<string, unknown>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = String(values[index] ?? "").trim();
    });

    const hasValue = Object.values(row).some((value) => String(value ?? "").trim().length > 0);
    if (hasValue) contracts.push(row);
  }

  return contracts;
}

function detectCsvSeparator(line: string): "," | ";" {
  const semicolonCount = (line.match(/;/g) ?? []).length;
  const commaCount = (line.match(/,/g) ?? []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseCsvLine(line: string, separator: "," | ";"): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === separator) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeContractImportHeader(rawHeader: string): string {
  const cleaned = rawHeader.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return "";

  const normalized = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (normalized === "id" || normalized === "contratoid" || normalized === "contractid") return "id";
  if (normalized === "nome" || normalized === "name") return "name";
  if (normalized === "cnpj") return "cnpj";
  if (normalized === "endereco" || normalized === "address") return "address";
  if (normalized === "cep" || normalized === "zipcode") return "zipCode";
  if (normalized === "telefone" || normalized === "phone") return "phone";
  if (normalized === "coordinatorid" || normalized === "coordenadorid") return "coordinatorId";
  if (normalized === "coordinatoremail" || normalized === "coordenadoremail" || normalized === "emailcoordenador") return "coordinatorEmail";
  if (normalized === "consultantids" || normalized === "consultorids" || normalized === "consultoresids") return "consultantIds";
  if (normalized === "consultantemails" || normalized === "consultoresemails" || normalized === "emailsconsultores") return "consultantEmails";
  if (normalized === "studentscount" || normalized === "students" || normalized === "alunos") return "studentsCount";
  if (normalized === "teacherscount" || normalized === "teachers" || normalized === "professores") return "teachersCount";
  if (normalized === "bookscount" || normalized === "books" || normalized === "livros") return "booksCount";

  return cleaned;
}
