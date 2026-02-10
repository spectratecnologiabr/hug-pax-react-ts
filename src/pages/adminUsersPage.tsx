import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Menubar from "../components/admin/menubar";
import Footer from "../components/footer";
import "../style/adminUsersPage.css";

import { getUsersSummaryAdmin } from "../controllers/user/getUsersSummaryAdmin.controller";
import { listUsersAdmin, type AdminUserRole, type AdminUserStatus, type IAdminUserListItem, resolveAdminUserStatus } from "../controllers/user/listUsersAdmin.controller";
import { setUserStatusAdmin } from "../controllers/user/setUserStatusAdmin.controller";
import { deleteUserAdmin } from "../controllers/user/deleteUserAdmin.controller";
import { createUserAdmin, type ICreateUserAdminData } from "../controllers/user/createUserAdmin.controller";
import { updateUserAdmin, type IUpdateUserAdminData } from "../controllers/user/updateUserAdmin.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { getUserAdmin } from "../controllers/user/getUserAdmin.controller";
import iconTotal from "../img/adminUsers/shield.svg";
import iconActive from "../img/adminUsers/shield-check.svg";
import iconInactive from "../img/adminUsers/shield-minus.svg";
import iconBlocked from "../img/adminUsers/shield-x.svg";
import iconSearch from "../img/adminUsers/search.svg";
import iconMail from "../img/adminUsers/mail.svg";
import iconUserPlus from "../img/adminUsers/user-plus.svg";
import iconDots from "../img/adminUsers/dots-vertical.svg";

type Summary = {
  total: number;
  active: number;
  inactive: number;
  blocked: number;
};

type User = {
  id: number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: AdminUserRole;
  profile: "Administrador" | "Educador" | "Consultor" | "Coordenador";
  status: AdminUserStatus;
  isActive?: boolean;
  isBlocked?: boolean;
  docType?: string;
  docId?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  language?: string;
  collegeId?: number | null;
  collegeName?: string;
  lastAccess: string;
};

type ConfirmAction = "deactivate" | "block" | "delete";

type ConfirmState = {
  open: boolean;
  action: ConfirmAction | null;
  user: User | null;
};

type UserModalMode = "create" | "view" | "edit";

type UserModalState = {
  open: boolean;
  mode: UserModalMode;
  user: User | null;
};

function roleLabel(role: AdminUserRole): User["profile"] {
  switch (role) {
    case "admin":
      return "Administrador";
    case "educator":
      return "Educador";
    case "consultant":
      return "Consultor";
    case "coordinator":
      return "Coordenador";
  }
}

function formatLastAccess(lastAccessAt?: string | null) {
  if (!lastAccessAt) return "—";
  const date = new Date(lastAccessAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR");
}

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map(p => p.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

function splitNameFallback(name: string) {
  const parts = name
    .split(" ")
    .map(p => p.trim())
    .filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function mapAdminUserToRow(user: IAdminUserListItem): User {
  const name = user.name?.trim() || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "—";
  const { firstName, lastName } = splitNameFallback(name);
  return {
    id: user.id,
    firstName: user.firstName ?? firstName,
    lastName: user.lastName ?? lastName,
    name,
    email: user.email,
    role: user.role,
    profile: roleLabel(user.role),
    status: resolveAdminUserStatus(user),
    isActive: user.isActive,
    isBlocked: user.isBlocked,
    docType: user.docType,
    docId: user.docId,
    birthDate: user.birthDate,
    gender: user.gender,
    phone: user.phone,
    language: user.language,
    collegeId: user.collegeId,
    collegeName: user.collegeName,
    lastAccess: formatLastAccess(user.lastAccessAt),
  };
}

function AdminUsersPage() {
  const isMountedRef = useRef(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState<AdminUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [openActionsUserId, setOpenActionsUserId] = useState<number | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLElement | null>(null);
  const [actionsMenuPos, setActionsMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, action: null, user: null });
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [userModal, setUserModal] = useState<UserModalState>({ open: false, mode: "create", user: null });
  const [userModalSubmitting, setUserModalSubmitting] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [userModalDetailsLoading, setUserModalDetailsLoading] = useState(false);
  const userModalRequestIdRef = useRef(0);
  const [colleges, setColleges] = useState<Array<{ id: number; name: string }>>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "educator" as AdminUserRole,
    isActive: "true" as "true" | "false",
    isBlocked: false,
    docType: "",
    docId: "",
    birthDate: "",
    gender: "male",
    phone: "",
    language: "pt-BR",
    collegeId: "" as "" | number,
  });

  const loadColleges = useCallback(async () => {
    if (collegesLoading) return;
    setCollegesLoading(true);
    try {
      const collegesList = await listColleges();
      if (Array.isArray(collegesList)) {
        setColleges(collegesList);
        return;
      }

      const payload = collegesList?.data ?? collegesList;
      if (Array.isArray(payload)) {
        setColleges(payload);
        return;
      }

      setColleges([]);
    } catch (e) {
      console.error("Erro ao carregar escolas", e);
      setColleges([]);
    } finally {
      setCollegesLoading(false);
    }
  }, [collegesLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const [users, summaryData] = await Promise.all([
        listUsersAdmin({
          search: search.trim() || undefined,
          role: profileFilter === "all" ? undefined : profileFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
        }),
        getUsersSummaryAdmin(),
      ]);

      if (!isMountedRef.current) return;
      const list: IAdminUserListItem[] = Array.isArray(users) ? users : users?.users ?? users?.items ?? [];
      setRows(list.map(mapAdminUserToRow));
      setSummary(summaryData);
    } catch (e) {
      console.error("Failed to load admin users:", e);
      if (!isMountedRef.current) return;
      setRows([]);
      setSummary(null);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [profileFilter, search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      await loadUsers();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loadUsers]);

  useEffect(() => {
    if (openActionsUserId == null) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (actionsButtonRef.current && actionsButtonRef.current.contains(target)) return;
      if (actionsMenuRef.current && actionsMenuRef.current.contains(target)) return;
      setOpenActionsUserId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenActionsUserId(null);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openActionsUserId]);

  useEffect(() => {
    if (openActionsUserId == null) return;

    const updatePosition = () => {
      const button = actionsButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuHeight = actionsMenuRef.current?.offsetHeight ?? 0;
      const preferredTop = rect.bottom + 8;

      let top = preferredTop;
      if (menuHeight && preferredTop + menuHeight > window.innerHeight - 8) {
        top = Math.max(8, rect.top - menuHeight - 8);
      }

      const left = Math.min(window.innerWidth - 8, Math.max(8, rect.right));
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
  }, [openActionsUserId]);

  useEffect(() => {
    if (!userModal.open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (userModalSubmitting) return;
        setUserModal({ open: false, mode: "create", user: null });
        setUserModalError(null);
        setUserModalDetailsLoading(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [userModal.open, userModalSubmitting]);

  function openUserModal(mode: UserModalMode, user?: User) {
    setUserModalError(null);
    setUserModalSubmitting(false);
    setUserModalDetailsLoading(false);
    setUserModal({ open: true, mode, user: user ?? null });
    loadColleges();

    if (mode === "create") {
      setUserForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "educator",
        isActive: "true",
        isBlocked: false,
        docType: "",
        docId: "",
        birthDate: "",
        gender: "male",
        phone: "",
        language: "pt-BR",
        collegeId: "",
      });
      return;
    }

    const { firstName, lastName } = splitNameFallback(user?.name ?? "");
    setUserForm({
      firstName: user?.firstName ?? firstName,
      lastName: user?.lastName ?? lastName,
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "educator",
      isActive: user?.isActive === false ? "false" : user?.isActive === true ? "true" : user?.status === "active" ? "true" : "false",
      isBlocked: Boolean(user?.isBlocked),
      docType: user?.docType ?? "",
      docId: user?.docId ?? "",
      birthDate: user?.birthDate ?? "",
      gender: user?.gender ?? "male",
      phone: user?.phone ?? "",
      language: user?.language ?? "pt-BR",
      collegeId: typeof user?.collegeId === "number" ? user.collegeId : "",
    });

    if (!user?.id) return;
    setUserModalDetailsLoading(true);
    const requestId = ++userModalRequestIdRef.current;
    getUserAdmin(user.id)
      .then((adminUser: any) => {
        if (userModalRequestIdRef.current !== requestId) return;
        const merged: User = {
          ...user,
          ...adminUser,
          id: user.id,
          name: `${adminUser?.firstName ?? user.firstName ?? ""} ${adminUser?.lastName ?? user.lastName ?? ""}`.trim() || user.name,
          role: (adminUser?.role ?? user.role) as AdminUserRole,
          status: resolveAdminUserStatus({
            isActive: adminUser?.isActive ?? user.isActive,
            isBlocked: adminUser?.isBlocked ?? user.isBlocked,
          }),
        };

        setUserModal(prev => (prev.open ? { ...prev, user: merged } : prev));

        setUserForm(prev => ({
          ...prev,
          firstName: String(adminUser?.firstName ?? prev.firstName ?? ""),
          lastName: String(adminUser?.lastName ?? prev.lastName ?? ""),
          email: String(adminUser?.email ?? prev.email ?? ""),
          role: (adminUser?.role ?? prev.role) as AdminUserRole,
          isActive: adminUser?.isActive === false ? "false" : "true",
          isBlocked: Boolean(adminUser?.isBlocked),
          docType: String(adminUser?.docType ?? prev.docType ?? ""),
          docId: String(adminUser?.docId ?? prev.docId ?? ""),
          birthDate: String(adminUser?.birthDate ?? prev.birthDate ?? ""),
          gender: String(adminUser?.gender ?? prev.gender ?? "male"),
          phone: String(adminUser?.phone ?? prev.phone ?? ""),
          language: String(adminUser?.language ?? prev.language ?? "pt-BR"),
          collegeId: typeof adminUser?.collegeId === "number" ? adminUser.collegeId : prev.collegeId,
        }));
      })
      .catch(err => {
        console.error("Erro ao buscar detalhes do usuário", err);
        if (userModalRequestIdRef.current !== requestId) return;
        setUserModalError("Não foi possível carregar os dados completos do usuário.");
      })
      .finally(() => {
        if (userModalRequestIdRef.current !== requestId) return;
        setUserModalDetailsLoading(false);
      });
  }

  function closeUserModal() {
    if (userModalSubmitting) return;
    setUserModal({ open: false, mode: "create", user: null });
    setUserModalError(null);
    setUserModalSubmitting(false);
    setUserModalDetailsLoading(false);
    userModalRequestIdRef.current += 1;
  }

  function openConfirm(action: ConfirmAction, user: User) {
    setConfirmError(null);
    setConfirmSubmitting(false);
    setConfirm({ open: true, action, user });
  }

  function closeConfirm() {
    if (confirmSubmitting) return;
    setConfirmError(null);
    setConfirmSubmitting(false);
    setConfirm({ open: false, action: null, user: null });
  }

  const confirmTitle =
    confirm.action === "deactivate"
      ? "Desativar usuário?"
      : confirm.action === "block"
        ? "Bloquear usuário?"
        : "Excluir usuário?";

  const confirmDescription =
    confirm.action === "deactivate"
      ? "O usuário perderá acesso ao sistema até ser ativado novamente."
      : confirm.action === "block"
        ? "O usuário ficará bloqueado e não conseguirá acessar."
        : "Essa ação não pode ser desfeita.";

  const confirmButtonLabel =
    confirm.action === "deactivate" ? "Desativar" : confirm.action === "block" ? "Bloquear" : "Excluir";

  async function handleConfirm() {
    if (!confirm.action || !confirm.user) return;
    setConfirmSubmitting(true);
    setConfirmError(null);

    try {
      if (confirm.action === "deactivate") {
        await setUserStatusAdmin(confirm.user.id, "inactive");
      } else if (confirm.action === "block") {
        await setUserStatusAdmin(confirm.user.id, "blocked");
      } else if (confirm.action === "delete") {
        await deleteUserAdmin(confirm.user.id);
      }

      closeConfirm();
      await loadUsers();
    } catch (e) {
      console.error("Failed to apply action:", e);
      setConfirmError("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setConfirmSubmitting(false);
    }
  }

  async function handleSubmitUserModal() {
    if (userModal.mode === "view") return;

    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const email = userForm.email.trim();
    const role = userForm.role;
    const password = userForm.password;
    const isActive = userForm.isActive === "true";
    const isBlocked = Boolean(userForm.isBlocked);
    const docType = userForm.docType?.trim() || undefined;
    const docId = userForm.docId?.trim() || undefined;
    const birthDate = userForm.birthDate?.trim() || undefined;
    const gender = userForm.gender?.trim() || undefined;
    const phone = userForm.phone?.trim() || undefined;
    const language = userForm.language?.trim() || undefined;
    const collegeId = userForm.collegeId === "" ? null : userForm.collegeId;

    if (!firstName || !lastName || !email || !role) {
      setUserModalError("Preencha nome, sobrenome, e-mail e perfil.");
      return;
    }

    if (userModal.mode === "create" && password.trim().length < 6) {
      setUserModalError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setUserModalSubmitting(true);
    setUserModalError(null);

    try {
      if (userModal.mode === "create") {
        const payload: ICreateUserAdminData = {
          firstName,
          lastName,
          email,
          password: password.trim(),
          role,
          isActive,
          isBlocked,
          docType,
          docId,
          birthDate,
          gender,
          phone,
          language,
          collegeId,
        };
        await createUserAdmin(payload);
      } else if (userModal.mode === "edit" && userModal.user) {
        const payload: IUpdateUserAdminData = {
          firstName,
          lastName,
          email,
          role,
          isActive,
          isBlocked,
          docType,
          docId,
          birthDate,
          gender,
          phone,
          language,
          collegeId,
        };
        await updateUserAdmin(userModal.user.id, payload);
      }

      closeUserModal();
      await loadUsers();
    } catch (e) {
      console.error("Failed to submit user modal:", e);
      setUserModalError("Não foi possível salvar. Verifique os dados e tente novamente.");
    } finally {
      setUserModalSubmitting(false);
    }
  }

  function toggleActionsMenu(user: User, buttonEl: HTMLElement) {
    if (openActionsUserId === user.id) {
      setOpenActionsUserId(null);
      return;
    }

    actionsButtonRef.current = buttonEl;
    const rect = buttonEl.getBoundingClientRect();
    setActionsMenuPos({ top: rect.bottom + 8, left: rect.right });
    setOpenActionsUserId(user.id);
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />

      <div className="admin-dashboard-wrapper sap-page admin-users-page">
	          <div className="admin-header-wrapper">
	          <div>
	            <b>Usuários e Permissões</b>
	            <span>Gerencie acessos ao sistema</span>
	          </div>
	          <div className="sap-top-actions">
	            <button className="sap-primary" onClick={() => openUserModal("create")}>
	              <img src={iconUserPlus} alt="" className="sap-btn-icon" />
	              Novo Usuário
	            </button>
	          </div>
	        </div>

        {summary && (
          <div className="sap-summary-grid">
            <div className="sap-summary-card total">
              <div className="sap-summary-icon total">
                <img src={iconTotal} alt="" />
              </div>
              <div className="sap-summary-content">
                <b>{summary.total}</b>
                <span>Total</span>
              </div>
            </div>
            <div className="sap-summary-card active">
              <div className="sap-summary-icon active">
                <img src={iconActive} alt="" />
              </div>
              <div className="sap-summary-content">
                <b>{summary.active}</b>
                <span>Ativos</span>
              </div>
            </div>
            <div className="sap-summary-card inactive">
              <div className="sap-summary-icon inactive">
                <img src={iconInactive} alt="" />
              </div>
              <div className="sap-summary-content">
                <b>{summary.inactive}</b>
                <span>Inativos</span>
              </div>
            </div>
            <div className="sap-summary-card blocked">
              <div className="sap-summary-icon blocked">
                <img src={iconBlocked} alt="" />
              </div>
              <div className="sap-summary-content">
                <b>{summary.blocked}</b>
                <span>Bloqueados</span>
              </div>
            </div>
          </div>
        )}

        <div className="sap-filters">
          <div className="sap-input sap-input-wide">
            <img className="sap-input-icon" src={iconSearch} alt="" />
            <input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="sap-select">
            <select value={profileFilter} onChange={e => setProfileFilter(e.target.value as any)}>
              <option value="all">Todos os perfis</option>
              <option value="admin">Administrador</option>
              <option value="coordinator">Coordenador</option>
              <option value="educator">Educador</option>
              <option value="consultant">Consultor</option>
            </select>
          </div>

          <div className="sap-select">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-header">
            <b>Lista de Usuários</b>
            {loading && <span style={{ marginLeft: 8, opacity: 0.7 }}>Carregando...</span>}
          </div>

          <table className="sap-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Último Acesso</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="sap-user-cell">
                      <div className="sap-avatar" aria-hidden="true">
                        {getInitials(u.name)}
                      </div>
                      <div className="sap-user-meta">
                        <b>{u.name}</b>
                        <div className="sap-user-email">
                          <img src={iconMail} alt="" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`sap-badge ${u.profile.toLowerCase()}`}>{u.profile}</span>
                  </td>
	                  <td>
	                    <span className={`sap-status ${u.status}`}>
	                      {u.status === "active" ? "Ativo" : u.status === "inactive" ? "Inativo" : "Bloqueado"}
	                    </span>
	                  </td>
	                  <td>{u.lastAccess}</td>
	                  <td
                      className="sap-actions"
                    >
	                    <button
                        className="sap-actions-btn"
                        aria-label="Ações"
                        aria-haspopup="menu"
                        aria-expanded={openActionsUserId === u.id}
                        onClick={e => toggleActionsMenu(u, e.currentTarget)}
                      >
	                      <img src={iconDots} alt="" />
	                    </button>
	                  </td>
	                </tr>
	              ))}
	            </tbody>
	          </table>
	        </div>

          {openActionsUserId != null &&
            (() => {
              const user = rows.find(r => r.id === openActionsUserId);
              if (!user) return null;
              return createPortal(
                <div
                  className="sap-actions-menu-portal"
                  role="menu"
                  ref={actionsMenuRef}
                  style={{ top: actionsMenuPos.top, left: actionsMenuPos.left }}
                >
                  <button
                    className="sap-actions-item"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsUserId(null);
                      openUserModal("view", user);
                    }}
                  >
                    Ver detalhes
                  </button>
                  <button
                    className="sap-actions-item"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsUserId(null);
                      openUserModal("edit", user);
                    }}
                  >
                    Editar
                  </button>
                  <div className="sap-actions-sep" role="separator" />
                  <button
                    className="sap-actions-item"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsUserId(null);
                      if (user.status === "inactive") {
                        setUserStatusAdmin(user.id, "active")
                          .then(loadUsers)
                          .catch(err => console.error("Failed to activate user:", err));
                        return;
                      }

                      openConfirm("deactivate", user);
                    }}
                  >
                    {user.status === "inactive" ? "Ativar" : "Desativar"}
                  </button>
                  <button
                    className="sap-actions-item"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsUserId(null);
                      if (user.status === "blocked") {
                        setUserStatusAdmin(user.id, "active")
                          .then(loadUsers)
                          .catch(err => console.error("Failed to unblock user:", err));
                        return;
                      }

                      openConfirm("block", user);
                    }}
                  >
                    {user.status === "blocked" ? "Desbloquear" : "Bloquear"}
                  </button>
                  <div className="sap-actions-sep" role="separator" />
                  <button
                    className="sap-actions-item danger"
                    role="menuitem"
                    onClick={() => {
                      setOpenActionsUserId(null);
                      openConfirm("delete", user);
                    }}
                  >
                    Excluir
                  </button>
                </div>,
                document.body
              );
            })()}

          {confirm.open && confirm.user && (
            <div
              className="sap-modal-overlay"
              role="dialog"
              aria-modal="true"
              onMouseDown={e => {
                if (e.target === e.currentTarget) closeConfirm();
              }}
            >
              <div className="sap-modal-card">
                <div className="sap-modal-header">
                  <b>{confirmTitle}</b>
                  <button className="sap-modal-close" onClick={closeConfirm} aria-label="Fechar" disabled={confirmSubmitting}>
                    ×
                  </button>
                </div>
                <div className="sap-modal-body">
                  <div className="sap-modal-user">
                    <div className="sap-avatar" aria-hidden="true">
                      {getInitials(confirm.user.name)}
                    </div>
                    <div className="sap-modal-user-meta">
                      <b>{confirm.user.name}</b>
                      <span>{confirm.user.email}</span>
                    </div>
                  </div>
                  <p className="sap-modal-desc">{confirmDescription}</p>
                  {confirmError && <div className="sap-modal-error">{confirmError}</div>}
                </div>
                <div className="sap-modal-actions">
                  <button className="sap-secondary" onClick={closeConfirm} disabled={confirmSubmitting}>
                    Cancelar
                  </button>
                  <button className="sap-danger" onClick={handleConfirm} disabled={confirmSubmitting}>
                    {confirmSubmitting ? "Processando..." : confirmButtonLabel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {userModal.open && (
            <div
              className="sap-user-modal-overlay"
              role="dialog"
              aria-modal="true"
              onMouseDown={e => {
                if (e.target === e.currentTarget) closeUserModal();
              }}
            >
              <div className="sap-user-modal-card">
                <div className="sap-user-modal-header">
                  <b>
                    {userModal.mode === "create"
                      ? "Novo usuário"
                      : userModal.mode === "view"
                        ? "Detalhes do usuário"
                        : "Editar usuário"}
                  </b>
                  <button
                    className="sap-modal-close"
                    onClick={closeUserModal}
                    aria-label="Fechar"
                    disabled={userModalSubmitting}
                  >
                    ×
                  </button>
                </div>

                <div className="sap-user-modal-body">
                  {userModalDetailsLoading && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: "#667085" }}>Carregando dados do usuário...</div>
                  )}
                  <div className="sap-user-form-grid">
                    <label className="sap-user-field">
                      <span>Nome</span>
                      <input
                        value={userForm.firstName}
                        onChange={e => setUserForm(s => ({ ...s, firstName: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        placeholder="Nome"
                      />
                    </label>
                    <label className="sap-user-field">
                      <span>Sobrenome</span>
                      <input
                        value={userForm.lastName}
                        onChange={e => setUserForm(s => ({ ...s, lastName: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        placeholder="Sobrenome"
                      />
                    </label>

                    <label className="sap-user-field">
                      <span>Tipo de Documento</span>
                      <select
                        value={userForm.docType}
                        onChange={e => setUserForm(s => ({ ...s, docType: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="">Selecionar</option>
                        <option value="cpf">CPF</option>
                      </select>
                    </label>

                    <label className="sap-user-field">
                      <span>Número do Documento</span>
                      <input
                        value={userForm.docId}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onKeyDown={e => {
                          const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                          if (allowedKeys.includes(e.key)) return;
                          if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                        }}
                        onChange={e => {
                          const formatted = formatDocId(e.target.value, userForm.docType || "cpf");
                          setUserForm(s => ({ ...s, docId: formatted }));
                        }}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        placeholder="Número do documento"
                      />
                    </label>

                    <label className="sap-user-field">
                      <span>Data de Nascimento</span>
                      <input
                        value={userForm.birthDate}
                        onChange={e => setUserForm(s => ({ ...s, birthDate: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        type="date"
                      />
                    </label>

                    <label className="sap-user-field sap-user-field-full">
                      <span>Email</span>
                      <input
                        value={userForm.email}
                        onChange={e => setUserForm(s => ({ ...s, email: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        placeholder="user@example.com"
                        type="email"
                      />
                    </label>

                    <label className="sap-user-field">
                      <span>Gênero</span>
                      <select
                        value={userForm.gender}
                        onChange={e => setUserForm(s => ({ ...s, gender: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </select>
                    </label>

                    <label className="sap-user-field">
                      <span>Telefone</span>
                      <input
                        value={userForm.phone}
                        onChange={e => setUserForm(s => ({ ...s, phone: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                        placeholder="(00) 00000-0000"
                      />
                    </label>

                    <label className="sap-user-field">
                      <span>Idioma</span>
                      <select
                        value={userForm.language}
                        onChange={e => setUserForm(s => ({ ...s, language: e.target.value }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="pt-BR">Português</option>
                        <option value="es-ES">Espanhol</option>
                        <option value="en-US">Inglês</option>
                      </select>
                    </label>

                    <label className="sap-user-field">
                      <span>Escola</span>
                      <select
                        value={userForm.collegeId === "" ? "" : String(userForm.collegeId)}
                        onChange={e =>
                          setUserForm(s => ({
                            ...s,
                            collegeId: e.target.value ? Number(e.target.value) : "",
                          }))
                        }
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading || collegesLoading}
                      >
                        <option value="">{collegesLoading ? "Carregando..." : "Selecionar"}</option>
                        {colleges.map(c => (
                          <option key={c.id} value={String(c.id)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>

                      {userModal.mode === "create" && (
                      <label className="sap-user-field sap-user-field-full">
                        <span>Senha</span>
                        <input
                          value={userForm.password}
                          onChange={e => setUserForm(s => ({ ...s, password: e.target.value }))}
                          disabled={userModalSubmitting || userModalDetailsLoading}
                          placeholder="Mínimo 6 caracteres"
                          type="password"
                        />
                      </label>
                    )}

                    <label className="sap-user-field">
                      <span>Perfil</span>
                      <select
                        value={userForm.role}
                        onChange={e => setUserForm(s => ({ ...s, role: e.target.value as AdminUserRole }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="admin">Administrador</option>
                        <option value="coordinator">Coordenador</option>
                        <option value="educator">Educador</option>
                        <option value="consultant">Consultor</option>
                      </select>
                    </label>

                    <label className="sap-user-field">
                      <span>Status</span>
                      <select
                        value={userForm.isActive}
                        onChange={e => setUserForm(s => ({ ...s, isActive: e.target.value as "true" | "false" }))}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </label>
                  </div>

                  {userModalError && <div className="sap-user-modal-error">{userModalError}</div>}
                </div>

                <div className="sap-user-modal-actions">
                  <button className="sap-secondary" onClick={closeUserModal} disabled={userModalSubmitting}>
                    {userModal.mode === "view" ? "Fechar" : "Cancelar"}
                  </button>
                  {userModal.mode !== "view" && (
                    <button className="sap-primary" onClick={handleSubmitUserModal} disabled={userModalSubmitting}>
                      {userModalSubmitting ? "Salvando..." : userModal.mode === "create" ? "Criar usuário" : "Salvar alterações"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
      <Footer />
    </div>
  );
}

export default AdminUsersPage;
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
