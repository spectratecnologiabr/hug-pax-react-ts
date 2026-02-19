import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { findCollege } from "../controllers/college/findCollege.controller";
import { createCollege } from "../controllers/college/createCollege.controller";
import { updateCollege } from "../controllers/college/updateCollege.controller";
import {
  importCollegesAdmin,
  type IImportCollegesAdminResponse,
} from "../controllers/college/importCollegesAdmin.controller";
import { checkSession } from "../controllers/user/checkSession.controller";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";
import { listTeachingGradesAdmin } from "../controllers/education/listTeachingGradesAdmin.controller";

import ConsultantMenubar from "../components/consultant/menubar";
import AdminMenubar from "../components/admin/menubar";
import CoordinatorMenubar from "../components/coordinator/menubar";
import iconDots from "../img/adminUsers/dots-vertical.svg";

import "../style/adminDash.css";
import "../style/collegesPage.css";

type TOverviewData = {
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  unreadNotifications: number;
};

type TCollege = {
  id: number;
  name: string;
  partner: string;
  address: string;
  addressNumber: number;
  state: string;
  city: string;
  management: string;
  salesManager: string;
  consultorId?: number;
  collegeSeries: unknown;
  contractSeries: unknown;
  internalManagement: unknown;
  educatorsLength: number;
  collegeCode?: number;
  initDate?: string;
  isActive?: boolean;
};

type TRole = "consultant" | "coordinator" | "admin";

type TConsultant = {
  id: number;
  firstName: string;
  lastName: string;
};

type TInternalManager = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

type TFormMode = "create" | "view" | "edit";

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean };
type TeachingGrade = { id: number; modalityId: number; name: string; order: number; isActive?: boolean };

type TCollegeForm = {
  id?: number;
  collegeCode: number | "";
  initDate: string;
  name: string;
  partner: string;
  address: string;
  addressNumber: number | "";
  state: string;
  city: string;
  management: string;
  salesManager: string;
  consultorId: number | "";
  collegeSeries: string[];
  contractSeries: string[];
  internalManagement: TInternalManager[];
  isActive: boolean;
};

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      return raw.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeManagers(value: unknown): TInternalManager[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as TInternalManager[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as TInternalManager[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function emptyForm(): TCollegeForm {
  return {
    collegeCode: "",
    initDate: "",
    name: "",
    partner: "",
    address: "",
    addressNumber: "",
    state: "",
    city: "",
    management: "",
    salesManager: "",
    consultorId: "",
    collegeSeries: [],
    contractSeries: [],
    internalManagement: [],
    isActive: true,
  };
}

function CollegesPage() {
  const isAdminPanel = window.location.pathname.startsWith("/admin");
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator");
  const collegesBasePath = isAdminPanel
    ? "/admin/colleges"
    : isCoordinatorPanel
      ? "/coordinator/colleges"
      : "/consultant/colleges";

  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
  const [colleges, setColleges] = useState<TCollege[]>([]);
  const [userRole, setUserRole] = useState<TRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TFormMode>("create");
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [collegeForm, setCollegeForm] = useState<TCollegeForm>(emptyForm());
  const [managerDraft, setManagerDraft] = useState<TInternalManager>({ name: "", role: "", email: "", phone: "" });

  const [consultants, setConsultants] = useState<TConsultant[]>([]);
  const [segments, setSegments] = useState<Array<{ value: string; label: string }>>([]);
  const [seriesBySegment, setSeriesBySegment] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [segmentsOpen, setSegmentsOpen] = useState(false);
  const [seriesOpen, setSeriesOpen] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openActionsCollegeId, setOpenActionsCollegeId] = useState<number | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLElement | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCollegesBuffer, setImportCollegesBuffer] = useState<Array<Record<string, unknown>>>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<IImportCollegesAdminResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const isViewMode = modalMode === "view";

  const availableSeries = useMemo(() => {
    return collegeForm.collegeSeries.flatMap((segmentKey) => seriesBySegment[segmentKey] || []);
  }, [collegeForm.collegeSeries, seriesBySegment]);

  async function loadColleges() {
    setLoading(true);
    try {
      const collegesList = await listColleges();
      setColleges(Array.isArray(collegesList) ? collegesList : []);
    } catch (error) {
      console.error("Error fetching colleges list:", error);
      setColleges([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const [overview, session] = await Promise.all([getOverviewData(), checkSession()]);
        setOverviewData(overview);
        setUserRole(session?.session?.role as TRole);
      } catch (error) {
        console.error("Bootstrap colleges page error:", error);
      }
      await loadColleges();
    }
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (openActionsCollegeId === null) return;

    function updateMenuPosition() {
      const button = actionsButtonRef.current;
      const menu = actionsMenuRef.current;
      if (!button || !menu) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = menu.offsetWidth || 190;
      const menuHeight = menu.offsetHeight || 120;
      const viewportPadding = 8;

      let left = rect.right;
      let top = rect.bottom + 8;

      if (left - menuWidth < viewportPadding) {
        left = rect.left + menuWidth;
      }
      if (top + menuHeight > window.innerHeight - viewportPadding) {
        top = Math.max(viewportPadding, rect.top - menuHeight - 8);
      }

      setActionsMenuPos({ left, top });
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (actionsMenuRef.current?.contains(target)) return;
      if (actionsButtonRef.current?.contains(target)) return;
      setOpenActionsCollegeId(null);
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenActionsCollegeId(null);
      }
    }

    updateMenuPosition();
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [openActionsCollegeId]);

  async function ensureFormDependencies() {
    try {
      const [consultantsData, modalitiesResp] = await Promise.all([
        listConsultants(),
        listTeachingModalitiesAdmin(),
      ]);
      setConsultants(Array.isArray(consultantsData) ? consultantsData : []);

      const modalities: TeachingModality[] = Array.isArray(modalitiesResp?.data)
        ? modalitiesResp.data
        : Array.isArray(modalitiesResp)
        ? modalitiesResp
        : [];

      const activeModalities = modalities.filter((m) => m.isActive !== false);
      const segmentOptions = activeModalities.map((m) => ({ value: String(m.id), label: m.name }));
      setSegments(segmentOptions);

      const gradeEntries = await Promise.all(
        activeModalities.map(async (m) => {
          const gradesResp = await listTeachingGradesAdmin(m.id);
          const grades: TeachingGrade[] = Array.isArray(gradesResp?.data)
            ? gradesResp.data
            : Array.isArray(gradesResp)
            ? gradesResp
            : [];

          const options = grades
            .filter((g) => g.isActive !== false)
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((g) => ({ value: String(g.id), label: g.name }));

          return [String(m.id), options] as const;
        })
      );

      const bySegment: Record<string, Array<{ value: string; label: string }>> = {};
      gradeEntries.forEach(([segmentId, options]) => {
        bySegment[segmentId] = options;
      });
      setSeriesBySegment(bySegment);
    } catch (error) {
      console.error("Error loading form dependencies:", error);
      setConsultants([]);
      setSegments([]);
      setSeriesBySegment({});
    }
  }

  function mapCollegeToForm(college: any): TCollegeForm {
    return {
      id: Number(college?.id) || undefined,
      collegeCode: Number(college?.collegeCode) || "",
      initDate: String(college?.initDate || ""),
      name: String(college?.name || ""),
      partner: String(college?.partner || ""),
      address: String(college?.address || ""),
      addressNumber: Number(college?.addressNumber) || "",
      state: String(college?.state || ""),
      city: String(college?.city || ""),
      management: String(college?.management || ""),
      salesManager: String(college?.salesManager || ""),
      consultorId: Number(college?.consultorId) || "",
      collegeSeries: normalizeArray(college?.collegeSeries),
      contractSeries: normalizeArray(college?.contractSeries),
      internalManagement: normalizeManagers(college?.internalManagement),
      isActive: Boolean(college?.isActive ?? true),
    };
  }

  async function openModal(mode: TFormMode, collegeId?: number) {
    setOpenActionsCollegeId(null);
    setModalMode(mode);
    setModalOpen(true);
    setSegmentsOpen(false);
    setSeriesOpen(false);
    setManagerDraft({ name: "", role: "", email: "", phone: "" });
    setFormLoading(true);

    try {
      await ensureFormDependencies();

      if ((mode === "view" || mode === "edit") && collegeId) {
        const collegeData = await findCollege(String(collegeId));
        setCollegeForm(mapCollegeToForm(collegeData));
      } else {
        setCollegeForm(emptyForm());
      }
    } finally {
      setFormLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setCollegeForm(emptyForm());
    setManagerDraft({ name: "", role: "", email: "", phone: "" });
  }

  function toggleSegment(value: string) {
    if (isViewMode) return;
    setCollegeForm((prev) => {
      const next = prev.collegeSeries.includes(value)
        ? prev.collegeSeries.filter((v) => v !== value)
        : [...prev.collegeSeries, value];

      const nextAvailableSeries = next.flatMap((segmentKey) => seriesBySegment[segmentKey] || []).map((s) => s.value);
      const filteredContractSeries = prev.contractSeries.filter((item) => nextAvailableSeries.includes(item));

      return {
        ...prev,
        collegeSeries: next,
        contractSeries: filteredContractSeries,
      };
    });
  }

  function toggleSeries(value: string) {
    if (isViewMode) return;
    setCollegeForm((prev) => ({
      ...prev,
      contractSeries: prev.contractSeries.includes(value)
        ? prev.contractSeries.filter((v) => v !== value)
        : [...prev.contractSeries, value],
    }));
  }

  function addManager() {
    if (isViewMode) return;
    if (!managerDraft.name.trim()) return;

    setCollegeForm((prev) => ({
      ...prev,
      internalManagement: [...prev.internalManagement, { ...managerDraft }],
    }));

    setManagerDraft({ name: "", role: "", email: "", phone: "" });
  }

  function removeManager(index: number) {
    if (isViewMode) return;
    setCollegeForm((prev) => ({
      ...prev,
      internalManagement: prev.internalManagement.filter((_, i) => i !== index),
    }));
  }

  async function submitCollege() {
    if (isViewMode) return;

    setFormSubmitting(true);
    try {
      const payload = {
        collegeCode: Number(collegeForm.collegeCode) || 0,
        initDate: collegeForm.initDate,
        name: collegeForm.name,
        partner: collegeForm.partner,
        address: collegeForm.address,
        addressNumber: Number(collegeForm.addressNumber) || 0,
        state: collegeForm.state,
        city: collegeForm.city,
        management: collegeForm.management,
        salesManager: collegeForm.salesManager,
        consultorId: Number(collegeForm.consultorId) || 0,
        collegeSeries: collegeForm.collegeSeries,
        contractSeries: collegeForm.contractSeries,
        internalManagement: collegeForm.internalManagement,
        isActive: collegeForm.isActive,
      };

      if (modalMode === "create") {
        const response = await createCollege(payload as any);
        if (response?.message === "College created") {
          setToast({ type: "success", text: "Escola criada com sucesso." });
        }
      }

      if (modalMode === "edit" && collegeForm.id) {
        const response = await updateCollege({ id: String(collegeForm.id), ...(payload as any) } as any);
        if (response?.message === "College updated") {
          setToast({ type: "success", text: "Escola atualizada com sucesso." });
        }
      }

      closeModal();
      await loadColleges();
    } catch (error) {
      console.error("Erro ao salvar escola:", error);
      setToast({ type: "error", text: "Não foi possível salvar a escola." });
    } finally {
      setFormSubmitting(false);
    }
  }

  function openImportModal() {
    setImportModalOpen(true);
    setImportCollegesBuffer([]);
    setImportFileName("");
    setImportSubmitting(false);
    setImportResult(null);
    setImportError(null);
  }

  function closeImportModal() {
    if (importSubmitting) return;
    setImportModalOpen(false);
    setImportCollegesBuffer([]);
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
      const parsedColleges = await parseCollegesImportFile(file);
      if (!parsedColleges.length) {
        setImportCollegesBuffer([]);
        setImportFileName(file.name);
        setImportError("Arquivo sem linhas válidas para importação.");
        return;
      }

      setImportCollegesBuffer(parsedColleges);
      setImportFileName(file.name);
    } catch (error: any) {
      setImportCollegesBuffer([]);
      setImportFileName(file.name);
      setImportError(String(error?.message ?? "Falha ao ler o arquivo de importação."));
    }
  }

  async function handleImportSubmit() {
    if (!importCollegesBuffer.length) {
      setImportError("Selecione um arquivo CSV ou JSON com escolas antes de importar.");
      return;
    }

    setImportSubmitting(true);
    setImportError(null);

    try {
      const result = await importCollegesAdmin({ colleges: importCollegesBuffer });
      setImportResult(result);
      await loadColleges();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? "Não foi possível concluir a importação.";
      setImportError(String(message));
    } finally {
      setImportSubmitting(false);
    }
  }

  function handleDownloadCollegeTemplateCsv() {
    const csvTemplate = [
      "codigo_escola;data_inicio;nome;parceiro;endereco;numero;estado;cidade;gerencia;comercial;consultor_id;segmentos;series_contratadas;status",
      "1001;2026-01-15;Escola Exemplo;Grupo Exemplo;Rua Alfa;123;SP;Sao Paulo;Regional 1;Joao Comercial;10;1,2;3,4;active",
      "1002;15/02/2026;Escola Modelo;Grupo Modelo;Rua Beta;45;RJ;Rio de Janeiro;Regional 2;Maria Comercial;12;2;5;inactive"
    ]
      .join(String.fromCharCode(10))
      .replace(/\\n/g, "\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo-importacao-escolas.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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

        <div className="admin-dashboard-wrapper colleges-page">
          <div className="colleges-header">
            <div>
              <b>Escolas</b>
              <span>Gestão centralizada das escolas parceiras e seus vínculos.</span>
            </div>
            <div className="colleges-header-actions">
              {isAdminPanel && userRole === "admin" ? (
                <button type="button" className="colleges-secondary-button" onClick={openImportModal}>
                  Importar escolas
                </button>
              ) : null}
              {userRole !== "consultant" ? (
                <button type="button" className="colleges-new-button" onClick={() => void openModal("create")}>
                  Nova Escola
                </button>
              ) : null}
            </div>
          </div>

          <div className="colleges-card">
            <div className="colleges-card-header">
              <b>Lista de Escolas</b>
            </div>

            {loading ? (
              <div className="colleges-empty">Carregando escolas...</div>
            ) : !colleges.length ? (
              <div className="colleges-empty">Nenhuma escola encontrada.</div>
            ) : (
              <div className="colleges-table-wrap">
                <table className="colleges-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Cidade / UF</th>
                      <th>Parceiro Contratante</th>
                      <th>Educadores</th>
                      <th>Séries Contratadas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colleges.map((college) => (
                      <tr key={college.id}>
                        <td>{college.name}</td>
                        <td>{college.city} - {college.state}</td>
                        <td>{college.partner}</td>
                        <td>{college.educatorsLength}</td>
                        <td>{normalizeArray(college.contractSeries).length}</td>
                        <td className="colleges-actions-cell">
                          <button
                            type="button"
                            className="colleges-actions-btn"
                            aria-label="Ações da escola"
                            onClick={(event) => {
                              if (openActionsCollegeId === college.id) {
                                setOpenActionsCollegeId(null);
                                return;
                              }
                              actionsButtonRef.current = event.currentTarget;
                              setOpenActionsCollegeId(college.id);
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
          <div className="colleges-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="colleges-modal-header">
              <div>
                <b>
                  {modalMode === "create"
                    ? "Cadastrar nova escola"
                    : modalMode === "edit"
                    ? "Editar escola"
                    : "Visualizar escola"}
                </b>
                <span>Preencha os dados da escola no padrão do painel administrativo.</span>
              </div>
              <div className="colleges-modal-header-actions">
                {modalMode === "view" ? (
                  <>
                    {userRole !== "consultant" ? (
                      <button
                        type="button"
                        className="colleges-ghost-button"
                        onClick={() => window.location.href = `${collegesBasePath}/${collegeForm.id}/final-report`}
                      >
                        Ficha Escolar
                      </button>
                    ) : null}
                    {userRole !== "consultant" ? (
                      <button type="button" className="colleges-ghost-button" onClick={() => setModalMode("edit")}>Editar</button>
                    ) : null}
                  </>
                ) : null}
                <button type="button" className="colleges-close-button" onClick={closeModal}>×</button>
              </div>
            </div>

            {formLoading ? (
              <div className="colleges-modal-loading">Carregando dados...</div>
            ) : (
              <div className="colleges-modal-body">
                <div className="colleges-form-grid">
                  <label>
                    <span>Cód. Escola*</span>
                    <input
                      value={collegeForm.collegeCode}
                      disabled={isViewMode}
                      onChange={(e) => setCollegeForm((prev) => ({ ...prev, collegeCode: Number(e.target.value) || "" }))}
                    />
                  </label>
                  <label>
                    <span>Data de Início*</span>
                    <input
                      type="date"
                      value={collegeForm.initDate}
                      disabled={isViewMode}
                      onChange={(e) => setCollegeForm((prev) => ({ ...prev, initDate: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Nome*</span>
                    <input value={collegeForm.name} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </label>
                  <label>
                    <span>Parceiro Contratante*</span>
                    <input value={collegeForm.partner} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, partner: e.target.value }))} />
                  </label>
                  <label>
                    <span>Endereço*</span>
                    <input value={collegeForm.address} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, address: e.target.value }))} />
                  </label>
                  <label>
                    <span>Número*</span>
                    <input value={collegeForm.addressNumber} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, addressNumber: Number(e.target.value) || "" }))} />
                  </label>
                  <label>
                    <span>Estado*</span>
                    <input value={collegeForm.state} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, state: e.target.value }))} />
                  </label>
                  <label>
                    <span>Município*</span>
                    <input value={collegeForm.city} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </label>
                  <label>
                    <span>Regional/Gerência*</span>
                    <input value={collegeForm.management} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, management: e.target.value }))} />
                  </label>

                  <div className="colleges-multiselect">
                    <span>Segmentos*</span>
                    <button type="button" className="colleges-multiselect-trigger" disabled={isViewMode} onClick={() => setSegmentsOpen((prev) => !prev)}>
                      {collegeForm.collegeSeries.length ? `${collegeForm.collegeSeries.length} segmento(s)` : "Selecionar segmentos"}
                    </button>
                    {segmentsOpen ? (
                      <div className="colleges-multiselect-popup">
                        {segments.map((segment) => (
                          <label key={segment.value}>
                            <input type="checkbox" checked={collegeForm.collegeSeries.includes(segment.value)} onChange={() => toggleSegment(segment.value)} />
                            <span>{segment.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="colleges-multiselect">
                    <span>Séries contratadas*</span>
                    <button type="button" className="colleges-multiselect-trigger" disabled={isViewMode} onClick={() => setSeriesOpen((prev) => !prev)}>
                      {collegeForm.contractSeries.length ? `${collegeForm.contractSeries.length} série(s)` : "Selecionar séries"}
                    </button>
                    {seriesOpen ? (
                      <div className="colleges-multiselect-popup">
                        {availableSeries.map((series) => (
                          <label key={series.value}>
                            <input type="checkbox" checked={collegeForm.contractSeries.includes(series.value)} onChange={() => toggleSeries(series.value)} />
                            <span>{series.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <label>
                    <span>Comercial responsável*</span>
                    <input value={collegeForm.salesManager} disabled={isViewMode} onChange={(e) => setCollegeForm((prev) => ({ ...prev, salesManager: e.target.value }))} />
                  </label>

                  <label>
                    <span>Consultor responsável*</span>
                    <select
                      value={collegeForm.consultorId}
                      disabled={isViewMode}
                      onChange={(e) => setCollegeForm((prev) => ({ ...prev, consultorId: Number(e.target.value) || "" }))}
                    >
                      <option value="">Selecione um consultor</option>
                      {consultants.map((consultant) => (
                        <option key={consultant.id} value={consultant.id}>
                          {consultant.firstName} {consultant.lastName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Status da escola*</span>
                    <select
                      value={collegeForm.isActive ? "active" : "inactive"}
                      disabled={isViewMode}
                      onChange={(e) => setCollegeForm((prev) => ({ ...prev, isActive: e.target.value === "active" }))}
                    >
                      <option value="active">Ativa</option>
                      <option value="inactive">Inativa</option>
                    </select>
                  </label>
                </div>

                <div className="colleges-managers-card">
                  <div className="colleges-managers-head">
                    <b>Equipe de Gestão</b>
                  </div>
                  <table className="colleges-managers-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Cargo</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        {!isViewMode ? <th>Ações</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {collegeForm.internalManagement.length ? (
                        collegeForm.internalManagement.map((member, index) => (
                          <tr key={`${member.name}-${index}`}>
                            <td>{member.name}</td>
                            <td>{member.role}</td>
                            <td>{member.email}</td>
                            <td>{member.phone}</td>
                            {!isViewMode ? (
                              <td>
                                <button type="button" className="colleges-remove-manager" onClick={() => removeManager(index)}>
                                  Remover
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isViewMode ? 4 : 5}>Nenhum membro adicionado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {!isViewMode ? (
                    <div className="colleges-manager-form">
                      <input placeholder="Nome" value={managerDraft.name} onChange={(e) => setManagerDraft((prev) => ({ ...prev, name: e.target.value }))} />
                      <input placeholder="Cargo" value={managerDraft.role} onChange={(e) => setManagerDraft((prev) => ({ ...prev, role: e.target.value }))} />
                      <input placeholder="Email" value={managerDraft.email} onChange={(e) => setManagerDraft((prev) => ({ ...prev, email: e.target.value }))} />
                      <input placeholder="Telefone" value={managerDraft.phone} onChange={(e) => setManagerDraft((prev) => ({ ...prev, phone: e.target.value }))} />
                      <button type="button" onClick={addManager}>Adicionar membro</button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="colleges-modal-footer">
              <button type="button" className="colleges-ghost-button" onClick={closeModal}>Fechar</button>
              {!isViewMode ? (
                <button type="button" className="colleges-primary-button" disabled={formSubmitting} onClick={() => void submitCollege()}>
                  {formSubmitting ? "Salvando..." : modalMode === "create" ? "Salvar escola" : "Salvar alterações"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={`colleges-toast ${toast.type}`}>{toast.text}</div> : null}
      {importModalOpen ? (
        <div className="colleges-modal-overlay" onClick={closeImportModal}>
          <div className="colleges-modal-card colleges-import-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="colleges-modal-header">
              <div>
                <b>Importar escolas</b>
                <span>Envie um arquivo CSV ou JSON para cadastro em lote.</span>
              </div>
              <button type="button" className="colleges-close-button" onClick={closeImportModal} disabled={importSubmitting}>×</button>
            </div>

            <div className="colleges-modal-body">
              <input
                ref={importFileRef}
                type="file"
                accept=".csv,.json,.txt"
                style={{ display: "none" }}
                onChange={(event) => void handleImportFileChange(event)}
              />

              <div className="colleges-import-actions">
                <button type="button" className="colleges-ghost-button" onClick={triggerImportFileSelect} disabled={importSubmitting}>
                  Selecionar arquivo
                </button>
                <button type="button" className="colleges-ghost-button" onClick={handleDownloadCollegeTemplateCsv} disabled={importSubmitting}>
                  Baixar modelo CSV
                </button>
              </div>

              {importFileName ? (
                <div className="colleges-import-meta">
                  <b>Arquivo:</b> {importFileName}
                </div>
              ) : null}

              {importCollegesBuffer.length > 0 ? (
                <div className="colleges-import-meta">
                  <b>Linhas prontas para importar:</b> {importCollegesBuffer.length}
                </div>
              ) : null}

              {importError ? <div className="colleges-import-error">{importError}</div> : null}

              {importResult ? (
                <div className="colleges-import-result">
                  <div className="colleges-import-summary">
                    <span>Total: {importResult.summary.total}</span>
                    <span>Criadas: {importResult.summary.created}</span>
                    <span>Falhas: {importResult.summary.failed}</span>
                  </div>

                  {importResult.summary.failed > 0 ? (
                    <div className="colleges-import-failures">
                      {importResult.results
                        .filter((item) => !item.success)
                        .slice(0, 20)
                        .map((item) => (
                          <div key={`${item.row}-${item.collegeCode ?? "sem-codigo"}`} className="colleges-import-failure-row">
                            <b>Linha {item.row}</b>
                            <span>{item.collegeCode ? `Cód. ${item.collegeCode}` : item.name ?? "Sem identificação"}</span>
                            <small>{item.message ?? "Falha na importação"}</small>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="colleges-modal-footer">
              <button type="button" className="colleges-ghost-button" onClick={closeImportModal} disabled={importSubmitting}>
                Fechar
              </button>
              <button
                type="button"
                className="colleges-primary-button"
                disabled={importSubmitting || importCollegesBuffer.length === 0}
                onClick={() => void handleImportSubmit()}
              >
                {importSubmitting ? "Importando..." : "Importar agora"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {openActionsCollegeId !== null
        ? createPortal(
            <div
              ref={actionsMenuRef}
              className="colleges-actions-menu-portal"
              style={{ top: actionsMenuPos.top, left: actionsMenuPos.left }}
            >
              <button
                type="button"
                className="colleges-actions-item"
                onClick={() => {
                  void openModal("view", openActionsCollegeId);
                }}
              >
                Visualizar
              </button>
              {userRole !== "consultant" ? (
                <button
                  type="button"
                  className="colleges-actions-item"
                  onClick={() => {
                    void openModal("edit", openActionsCollegeId);
                  }}
                >
                  Editar
                </button>
              ) : null}
              {userRole !== "consultant" ? (
                <button
                  type="button"
                  className="colleges-actions-item"
                  onClick={() => {
                    window.location.href = `${collegesBasePath}/${openActionsCollegeId}/final-report`;
                    setOpenActionsCollegeId(null);
                  }}
                >
                  Ficha escolar
                </button>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

async function parseCollegesImportFile(file: File): Promise<Array<Record<string, unknown>>> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const text = await file.text();
  if (!text.trim()) throw new Error("Arquivo vazio.");

  if (ext === "json") {
    const parsed = JSON.parse(text);
    const colleges = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.colleges) ? parsed.colleges : [];
    if (!Array.isArray(colleges)) throw new Error("JSON inválido. Esperado array de escolas.");
    return colleges as Array<Record<string, unknown>>;
  }

  if (ext !== "csv" && ext !== "txt") {
    throw new Error("Formato inválido. Use arquivo .csv ou .json.");
  }

  return parseCsvColleges(text);
}

function parseCsvColleges(text: string): Array<Record<string, unknown>> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) throw new Error("CSV inválido. Informe cabeçalho + pelo menos uma linha.");

  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const separator = detectCsvSeparator(headerLine);
  const headers = parseCsvLine(headerLine, separator).map(normalizeCollegeImportHeader);

  if (!headers.length) throw new Error("Cabeçalho do CSV inválido.");

  const rows: Array<Record<string, unknown>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = String(values[index] ?? "").trim();
    });

    const hasValue = Object.values(row).some((value) => String(value ?? "").trim().length > 0);
    if (hasValue) rows.push(row);
  }

  return rows;
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

function normalizeCollegeImportHeader(rawHeader: string): string {
  const cleaned = rawHeader.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return "";

  const normalized = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (normalized === "codigoescola" || normalized === "collegecode" || normalized === "codigo") return "collegeCode";
  if (normalized === "datainicio" || normalized === "initdate") return "initDate";
  if (normalized === "nome" || normalized === "name") return "name";
  if (normalized === "parceiro" || normalized === "partner") return "partner";
  if (normalized === "endereco" || normalized === "address") return "address";
  if (normalized === "numero" || normalized === "addressnumber") return "addressNumber";
  if (normalized === "estado" || normalized === "state") return "state";
  if (normalized === "cidade" || normalized === "city") return "city";
  if (normalized === "gerencia" || normalized === "regional" || normalized === "management") return "management";
  if (normalized === "comercial" || normalized === "salesmanager") return "salesManager";
  if (normalized === "consultor" || normalized === "consultorid") return "consultorId";
  if (normalized === "segmentos" || normalized === "collegeseries") return "collegeSeries";
  if (normalized === "seriescontratadas" || normalized === "contractseries") return "contractSeries";
  if (normalized === "gestaointerna" || normalized === "internalmanagement") return "internalManagement";
  if (normalized === "status" || normalized === "isactive") return "status";

  return cleaned;
}

export default CollegesPage;
