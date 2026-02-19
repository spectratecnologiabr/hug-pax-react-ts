import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listEducators } from "../controllers/user/listEducators.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { findUser } from "../controllers/user/findUser.controller";
import { createUser, ICreateUserData } from "../controllers/user/createUser.controller";
import updateUser from "../controllers/user/updateUser.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

import Menubar from "../components/consultant/menubar";
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

type TRole = "consultant" | "coordinator" | "admin";
type TFormMode = "create" | "view" | "edit";

type TCollege = {
  id: number;
  name: string;
};

type TEducator = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  collegeId: number | null;
  createdAt: string;
};

type TEducatorForm = {
  id: number | null;
  firstName: string;
  lastName: string;
  email: string;
  docType: string;
  docId: string;
  birthDate: string;
  gender: string;
  phone: string;
  language: string;
  collegeId: number | "";
  isActive: boolean;
};

function emptyForm(): TEducatorForm {
  return {
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    docType: "cpf",
    docId: "",
    birthDate: "",
    gender: "male",
    phone: "",
    language: "pt-BR",
    collegeId: "",
    isActive: true,
  };
}

function formatDocId(docId: string, docType: string) {
  if (!docId) return "";

  const clean = docId.replace(/\W/g, "");
  if (docType === "cpf") {
    return clean
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  }

  return docId;
}

function normalizeColleges(payload: any): TCollege[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function EducatorsList() {
  const isCoordinatorPanel = window.location.pathname.startsWith("/coordinator");
  const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
  const [educators, setEducators] = useState<TEducator[]>([]);
  const [colleges, setColleges] = useState<TCollege[]>([]);
  const [userRole, setUserRole] = useState<TRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TFormMode>("create");
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [educatorForm, setEducatorForm] = useState<TEducatorForm>(emptyForm());

  const [isError, setIsError] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [openActionsEducatorId, setOpenActionsEducatorId] = useState<number | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLElement | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const isViewMode = modalMode === "view";
  const canManage = userRole !== "consultant";

  const collegesById = useMemo(() => {
    const map: Record<number, string> = {};
    colleges.forEach((college) => {
      map[college.id] = college.name;
    });
    return map;
  }, [colleges]);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const [overview, session, educatorsList, collegesList] = await Promise.all([
          getOverviewData(),
          checkSession(),
          listEducators(),
          listColleges(),
        ]);
        setOverviewData(overview);
        setUserRole(session?.session?.role as TRole);
        setEducators(Array.isArray(educatorsList) ? educatorsList : []);
        setColleges(normalizeColleges(collegesList));
      } catch (error) {
        console.error("Error loading educators page:", error);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!modalErrorOpen) return;
    const timer = window.setTimeout(() => setModalErrorOpen(false), 3500);
    return () => window.clearTimeout(timer);
  }, [modalErrorOpen]);

  useEffect(() => {
    if (openActionsEducatorId === null) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (actionsButtonRef.current?.contains(target)) return;
      if (actionsMenuRef.current?.contains(target)) return;
      setOpenActionsEducatorId(null);
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenActionsEducatorId(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [openActionsEducatorId]);

  useEffect(() => {
    if (openActionsEducatorId === null) return;

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

    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openActionsEducatorId]);

  async function loadEducators() {
    try {
      setLoading(true);
      const educatorsList = await listEducators();
      setEducators(Array.isArray(educatorsList) ? educatorsList : []);
    } catch (error) {
      console.error("Error fetching educators:", error);
    } finally {
      setLoading(false);
    }
  }

  async function openModal(mode: TFormMode, educatorId?: number) {
    setOpenActionsEducatorId(null);
    setModalMode(mode);
    setModalOpen(true);

    if (mode === "create") {
      setEducatorForm(emptyForm());
      setFormLoading(false);
      return;
    }

    if (!educatorId) return;

    setFormLoading(true);
    try {
      const userData = await findUser(educatorId);
      setEducatorForm({
        id: userData.id,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        docType: userData.docType || "cpf",
        docId: userData.docId || "",
        birthDate: userData.birthDate || "",
        gender: userData.gender || "male",
        phone: userData.phone || "",
        language: userData.language || "pt-BR",
        collegeId: userData.collegeId || "",
        isActive: Boolean(userData.isActive),
      });
    } catch (error) {
      console.error("Error fetching educator data:", error);
      setModalOpen(false);
      setMessage("Não foi possível carregar o educador.");
      setIsError(true);
      setModalErrorOpen(true);
    } finally {
      setFormLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setFormLoading(false);
    setFormSubmitting(false);
  }

  async function submitEducator() {
    if (isViewMode) return;

    setFormSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload: ICreateUserData = {
          firstName: educatorForm.firstName,
          lastName: educatorForm.lastName,
          email: educatorForm.email,
          password: "Temp@123",
          role: "educator",
          docType: educatorForm.docType,
          docId: educatorForm.docId,
          birthDate: educatorForm.birthDate,
          gender: educatorForm.gender,
          phone: educatorForm.phone,
          language: educatorForm.language,
          collegeId: educatorForm.collegeId === "" ? null : Number(educatorForm.collegeId),
        };
        await createUser(payload);
        setMessage("Educador criado com sucesso.");
      }

      if (modalMode === "edit" && educatorForm.id) {
        await updateUser(educatorForm.id, {
          firstName: educatorForm.firstName,
          lastName: educatorForm.lastName,
          email: educatorForm.email,
          docType: educatorForm.docType,
          docId: educatorForm.docId,
          birthDate: educatorForm.birthDate,
          gender: educatorForm.gender,
          phone: educatorForm.phone,
          language: educatorForm.language,
          collegeId: educatorForm.collegeId === "" ? null : Number(educatorForm.collegeId),
          isActive: educatorForm.isActive,
        });
        setMessage("Educador atualizado com sucesso.");
      }

      setIsError(false);
      setModalErrorOpen(true);
      closeModal();
      await loadEducators();
    } catch (error) {
      console.error("Error saving educator:", error);
      setMessage("Não foi possível salvar o educador.");
      setIsError(true);
      setModalErrorOpen(true);
    } finally {
      setFormSubmitting(false);
    }
  }

  function updateField(field: keyof TEducatorForm, value: string | number | boolean) {
    setEducatorForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <React.Fragment>
      <div className="admin-dashboard-container">
        {isCoordinatorPanel ? (
          <CoordinatorMenubar />
        ) : (
          <Menubar notificationCount={Number(overviewData?.unreadNotifications)} />
        )}
        <div className="admin-dashboard-wrapper colleges-page">
          <div className="colleges-header">
            <div>
              <b>Educadores</b>
              <span>Gestão centralizada dos educadores vinculados às escolas.</span>
            </div>
            {canManage ? (
              <button
                type="button"
                className="colleges-new-button"
                onClick={() => {
                  void openModal("create");
                }}
              >
                Novo Educador
              </button>
            ) : null}
          </div>

          <div className="colleges-card">
            <div className="colleges-card-header">
              <b>Lista de Educadores</b>
            </div>

            {loading ? (
              <div className="colleges-empty">Carregando educadores...</div>
            ) : !educators.length ? (
              <div className="colleges-empty">Nenhum educador encontrado.</div>
            ) : (
              <div className="colleges-table-wrap">
                <table className="colleges-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Escola Associada</th>
                      <th>Criado Em</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educators.map((educator) => (
                      <tr key={educator.id}>
                        <td>{educator.firstName} {educator.lastName}</td>
                        <td>{educator.email}</td>
                        <td>{educator.isActive ? "Ativo" : "Inativo"}</td>
                        <td>{educator.collegeId ? collegesById[educator.collegeId] || "Carregando..." : "-"}</td>
                        <td>{new Date(educator.createdAt).toLocaleDateString("pt-BR")}</td>
                        <td className="colleges-actions-cell">
                          <button
                            type="button"
                            title="Ações"
                            aria-haspopup="menu"
                            aria-expanded={openActionsEducatorId === educator.id}
                            className="colleges-actions-btn"
                            onClick={(event) => {
                              if (openActionsEducatorId === educator.id) {
                                setOpenActionsEducatorId(null);
                                return;
                              }
                              actionsButtonRef.current = event.currentTarget;
                              setOpenActionsEducatorId(educator.id);
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
                <b>
                  {modalMode === "create"
                    ? "Cadastrar novo educador"
                    : modalMode === "edit"
                    ? "Editar educador"
                    : "Visualizar cadastro do educador"}
                </b>
                {modalMode === "view" ? (
                  <span>
                    Dados cadastrais em modo somente leitura.
                  </span>
                ) : null}
              </div>
              <div className="colleges-modal-header-actions">
                {modalMode === "view" && canManage ? (
                  <button type="button" className="colleges-ghost-button" onClick={() => setModalMode("edit")}>
                    Editar
                  </button>
                ) : null}
                <button type="button" className="colleges-close-button" onClick={closeModal}>×</button>
              </div>
            </div>

            {formLoading ? (
              <div className="colleges-modal-loading">Carregando dados...</div>
            ) : (
              <div className="colleges-modal-body">
                <div className="colleges-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <label htmlFor="firstName">
                    <span>Nome</span>
                  <input
                    type="text"
                    id="firstName"
                    value={educatorForm.firstName}
                    disabled={isViewMode}
                    onChange={(event) => updateField("firstName", event.target.value)}
                  />
                  </label>
                  <label htmlFor="lastName">
                    <span>Sobrenome</span>
                  <input
                    type="text"
                    id="lastName"
                    value={educatorForm.lastName}
                    disabled={isViewMode}
                    onChange={(event) => updateField("lastName", event.target.value)}
                  />
                  </label>
                  <label htmlFor="docType">
                    <span>Tipo de documento</span>
                  <select
                    id="docType"
                    value={educatorForm.docType}
                    disabled={isViewMode}
                    onChange={(event) => updateField("docType", event.target.value)}
                  >
                    <option value="cpf">CPF</option>
                  </select>
                  </label>
                  <label htmlFor="docId">
                    <span>Número do documento</span>
                  <input
                    type="text"
                    id="docId"
                    value={educatorForm.docId}
                    disabled={isViewMode}
                    onKeyDown={(event) => {
                      const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                      if (allowedKeys.includes(event.key)) return;
                      if (!/^[0-9]$/.test(event.key)) event.preventDefault();
                    }}
                    onChange={(event) => updateField("docId", formatDocId(event.target.value, educatorForm.docType))}
                  />
                  </label>
                  <label htmlFor="birthDate">
                    <span>Data de nascimento</span>
                  <input
                    type="date"
                    id="birthDate"
                    value={educatorForm.birthDate}
                    disabled={isViewMode}
                    onChange={(event) => updateField("birthDate", event.target.value)}
                  />
                  </label>
                  <label htmlFor="gender">
                    <span>Gênero</span>
                  <select
                    id="gender"
                    value={educatorForm.gender}
                    disabled={isViewMode}
                    onChange={(event) => updateField("gender", event.target.value)}
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                  </label>
                  <label htmlFor="phone">
                    <span>Telefone</span>
                  <input
                    type="text"
                    id="phone"
                    value={educatorForm.phone}
                    disabled={isViewMode}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                  </label>
                  <label htmlFor="email">
                    <span>Email</span>
                  <input
                    type="text"
                    id="email"
                    value={educatorForm.email}
                    disabled={isViewMode}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                  </label>
                  <label htmlFor="language">
                    <span>Idioma</span>
                  <select
                    id="language"
                    value={educatorForm.language}
                    disabled={isViewMode}
                    onChange={(event) => updateField("language", event.target.value)}
                  >
                    <option value="pt-BR">Português</option>
                    <option value="es-ES">Espanhol</option>
                    <option value="en-US">Inglês</option>
                  </select>
                  </label>
                  <label htmlFor="collegeId">
                    <span>Escola</span>
                  <select
                    id="collegeId"
                    value={educatorForm.collegeId === "" ? "" : String(educatorForm.collegeId)}
                    disabled={isViewMode}
                    onChange={(event) => updateField("collegeId", event.target.value === "" ? "" : Number(event.target.value))}
                  >
                    <option value="">Selecione uma escola</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>{college.name}</option>
                    ))}
                  </select>
                  </label>
                  {modalMode !== "create" ? (
                    <label htmlFor="isActive">
                      <span>Status</span>
                    <select
                      id="isActive"
                      value={String(educatorForm.isActive)}
                      disabled={isViewMode}
                      onChange={(event) => updateField("isActive", event.target.value === "true")}
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                    </label>
                  ) : null}
                </div>
              </div>
            )}

            <div className="colleges-modal-footer">
              <button type="button" className="colleges-ghost-button" onClick={closeModal}>Fechar</button>
              {!isViewMode ? (
                <button type="button" className="colleges-primary-button" disabled={formSubmitting} onClick={() => void submitEducator()}>
                  {formSubmitting ? "Salvando..." : modalMode === "create" ? "Salvar educador" : "Salvar alterações"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {openActionsEducatorId !== null
        ? createPortal(
            <div
              ref={actionsMenuRef}
              className="colleges-actions-menu-portal"
              role="menu"
              style={{ top: actionsMenuPos.top, left: actionsMenuPos.left }}
            >
              <button
                type="button"
                role="menuitem"
                className="colleges-actions-item"
                onClick={() => {
                  void openModal("view", openActionsEducatorId);
                }}
              >
                Visualizar cadastro
              </button>
              {canManage ? (
                <button
                  type="button"
                  role="menuitem"
                  className="colleges-actions-item"
                  onClick={() => {
                    void openModal("edit", openActionsEducatorId);
                  }}
                >
                  Editar
                </button>
              ) : null}
            </div>,
            document.body
          )
        : null}

      <div className={`warning-container ${isError ? "error" : "success"} ${modalErrorOpen ? "open" : ""}`}>
        <button onClick={() => setModalErrorOpen(false)}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000" />
          </svg>
        </button>
        <span>{message}</span>
      </div>
    </React.Fragment>
  );
}

export default EducatorsList;
