import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Menubar from "../components/admin/menubar";
import Footer from "../components/footer";
import "../style/adminUsersPage.css";

import { getUsersSummaryAdmin } from "../controllers/user/getUsersSummaryAdmin.controller";
import { listUsersAdmin, type AdminUserRole, type AdminUserStatus, type IAdminUserListItem, resolveAdminUserStatus } from "../controllers/user/listUsersAdmin.controller";
import { listManagementsAdmin } from "../controllers/user/listManagementsAdmin.controller";
import { setUserStatusAdmin } from "../controllers/user/setUserStatusAdmin.controller";
import { setUserVacationModeAdmin } from "../controllers/user/setUserVacationModeAdmin.controller";
import { deleteUserAdmin } from "../controllers/user/deleteUserAdmin.controller";
import { createUserAdmin, type ICreateUserAdminData } from "../controllers/user/createUserAdmin.controller";
import { updateUserAdmin, type IUpdateUserAdminData } from "../controllers/user/updateUserAdmin.controller";
import { importUsersAdmin, type IImportUsersAdminResponse } from "../controllers/user/importUsersAdmin.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { listContracts } from "../controllers/contract/listContracts.controller";
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

type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

type User = {
  id: number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: AdminUserRole;
  profile: "Administrador" | "Educador" | "Consultor" | "Coordenador" | "Consultor especialista";
  status: AdminUserStatus;
  isActive?: boolean;
  isBlocked?: boolean;
  vacationMode?: boolean;
  vacationMessage?: string | null;
  docType?: string;
  docId?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  language?: string;
  collegeId?: number | null;
  collegeName?: string;
  createdAt?: string | null;
  lastAccessAt?: string | null;
  updatedAt?: string | null;
  management?: string;
  lastAccess: string;
};

type InactivityFilter = "all" | "7" | "15" | "30" | "60" | "90" | "never";
type SortOrder = "name_asc" | "name_desc" | "created_asc" | "created_desc";

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
    case "specialist_consultant":
      return "Consultor especialista";
  }
}

function formatLastAccess(lastAccessAt?: string | null) {
  const date = parseAccessDate(lastAccessAt);
  if (!date) return "—";
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function parseAccessDate(lastAccessAt?: string | null) {
  if (!lastAccessAt) return null;
  const raw = String(lastAccessAt).trim();
  if (!raw) return null;

  // MySQL DATETIME/TIMESTAMP may arrive without timezone, e.g. "2026-02-19 15:30:00".
  // Treat this shape as UTC to avoid +3h drift when rendering in GMT-3.
  const noTzSqlPattern = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;
  const normalized = noTzSqlPattern.test(raw)
    ? `${raw.replace(" ", "T")}Z`
    : raw;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
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

function normalizeManagement(value: unknown) {
  return String(value ?? "").trim();
}

function sortCollegesByName<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "pt-BR", { sensitivity: "base" })
  );
}

function sortContractsByName<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "pt-BR", { sensitivity: "base" })
  );
}

const EMPTY_MANAGEMENT_FILTER = "__EMPTY__";

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
    vacationMode: Boolean(user.vacationMode),
    vacationMessage: user.vacationMessage ?? null,
    docType: user.docType,
    docId: user.docId,
    birthDate: user.birthDate,
    gender: user.gender,
    phone: user.phone,
    language: user.language,
    collegeId: user.collegeId,
    collegeName: user.collegeName,
    createdAt: user.createdAt ?? null,
    lastAccessAt: user.lastAccessAt ?? null,
    updatedAt: user.updatedAt ?? null,
    management: user.management ?? "",
    lastAccess: formatLastAccess(user.lastAccessAt ?? user.updatedAt),
  };
}

function AdminUsersPage() {
  const isMountedRef = useRef(true);
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState<AdminUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "all">("all");
  const [managementFilter, setManagementFilter] = useState<string>("all");
  const [inactivityFilter, setInactivityFilter] = useState<InactivityFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("created_desc");
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
  const [colleges, setColleges] = useState<Array<{ id: number; name: string; contractId?: number | null }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: number; name: string }>>([]);
  const [managementOptionsFromRegistry, setManagementOptionsFromRegistry] = useState<string[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);
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
    contractId: "" as "" | number,
    collegeId: "" as "" | number,
    management: "",
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUsersBuffer, setImportUsersBuffer] = useState<Array<Record<string, unknown>>>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<IImportUsersAdminResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadColleges = useCallback(async () => {
    if (collegesLoading) return;
    setCollegesLoading(true);
    try {
      const collegesList = await listColleges();
      if (Array.isArray(collegesList)) {
        setColleges(
          sortCollegesByName(
            collegesList.map((item: any) => ({
              id: Number(item?.id),
              name: String(item?.name ?? ""),
              contractId: Number(item?.contractId ?? item?.contract_id) || null,
            }))
          )
        );
        return;
      }

      const payload = collegesList?.data ?? collegesList;
      if (Array.isArray(payload)) {
        setColleges(
          sortCollegesByName(
            payload.map((item: any) => ({
              id: Number(item?.id),
              name: String(item?.name ?? ""),
              contractId: Number(item?.contractId ?? item?.contract_id) || null,
            }))
          )
        );
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

  const loadContracts = useCallback(async () => {
    if (contractsLoading) return;
    setContractsLoading(true);
    try {
      const contractsList = await listContracts();
      if (Array.isArray(contractsList)) {
        setContracts(
          sortContractsByName(
            contractsList.map((item: any) => ({
              id: Number(item?.id),
              name: String(item?.name ?? ""),
            }))
          )
        );
        return;
      }
      setContracts([]);
    } catch (e) {
      console.error("Erro ao carregar contratos", e);
      setContracts([]);
    } finally {
      setContractsLoading(false);
    }
  }, [contractsLoading]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const values = await listManagementsAdmin();

        if (!alive) return;
        setManagementOptionsFromRegistry(
          Array.from(new Set(values.map((value) => normalizeManagement(value)).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b, "pt-BR")
          )
        );
      } catch (error) {
        console.error("Erro ao carregar opções de rede", error);
        if (!alive) return;
        setManagementOptionsFromRegistry([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const apiSort = useMemo(() => {
    switch (sortOrder) {
      case "name_asc":
        return { sortBy: "name" as const, sortDir: "asc" as const };
      case "name_desc":
        return { sortBy: "name" as const, sortDir: "desc" as const };
      case "created_asc":
        return { sortBy: "created_at" as const, sortDir: "asc" as const };
      case "created_desc":
      default:
        return { sortBy: "created_at" as const, sortDir: "desc" as const };
    }
  }, [sortOrder]);

  const loadUsers = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    try {
      const [users, summaryData] = await Promise.all([
        listUsersAdmin({
          search: search.trim() || undefined,
          role: profileFilter === "all" ? undefined : profileFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          management: managementFilter === "all" ? undefined : managementFilter,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: apiSort.sortBy,
          sortDir: apiSort.sortDir,
        }),
        getUsersSummaryAdmin({
          search: search.trim() || undefined,
          role: profileFilter === "all" ? undefined : profileFilter,
          management: managementFilter === "all" ? undefined : managementFilter,
        }),
      ]);

      if (!isMountedRef.current) return;
      const list: IAdminUserListItem[] = Array.isArray(users) ? users : users?.users ?? users?.items ?? [];
      const rawPagination = !Array.isArray(users) ? users?.pagination : undefined;
      const total = Number(rawPagination?.total ?? list.length ?? 0);
      const page = Math.max(1, Number(rawPagination?.page ?? pagination.page));
      const pageSize = Math.max(1, Number(rawPagination?.pageSize ?? pagination.pageSize));
      setRows(list.map(mapAdminUserToRow));
      setPagination({ page, pageSize, total });
      setSummary(summaryData);
    } catch (e) {
      console.error("Failed to load admin users:", e);
      if (!isMountedRef.current) return;
      setRows([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      setSummary(null);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [apiSort.sortBy, apiSort.sortDir, managementFilter, pagination.page, pagination.pageSize, profileFilter, search, statusFilter]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [search, profileFilter, statusFilter, managementFilter, inactivityFilter, sortOrder]);

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

  const filteredRows = rows.filter((user) => {
    if (inactivityFilter === "all") return true;
    if (inactivityFilter === "never") return !parseAccessDate(user.lastAccessAt ?? user.updatedAt);

    const date = parseAccessDate(user.lastAccessAt ?? user.updatedAt);
    if (!date) return false;

    const days = Number(inactivityFilter);
    if (!Number.isFinite(days) || days <= 0) return true;

    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    return diffDays >= days;
  });

  const managementOptions = useMemo(() => {
    const values = new Set<string>();
    managementOptionsFromRegistry.forEach((value) => {
      const normalized = normalizeManagement(value);
      if (normalized) values.add(normalized);
    });
    rows.forEach((user) => {
      const normalized = normalizeManagement(user.management);
      if (normalized) values.add(normalized);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [managementOptionsFromRegistry, rows]);

  const totalPages = useMemo(() => {
    if (pagination.total <= 0 || pagination.pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  }, [pagination.pageSize, pagination.total]);

  useEffect(() => {
    if (pagination.page <= totalPages) return;
    setPagination(prev => ({ ...prev, page: totalPages }));
  }, [pagination.page, totalPages]);

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
    loadContracts();

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
        contractId: "",
        collegeId: "",
        management: "",
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
      contractId: "",
      collegeId: typeof user?.collegeId === "number" ? user.collegeId : "",
      management: user?.management ?? "",
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
          contractId: prev.contractId,
          collegeId: typeof adminUser?.collegeId === "number" ? adminUser.collegeId : prev.collegeId,
          management: String(adminUser?.management ?? prev.management ?? ""),
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

  function openImportModal() {
    setImportModalOpen(true);
    setImportUsersBuffer([]);
    setImportFileName("");
    setImportSubmitting(false);
    setImportResult(null);
    setImportError(null);
  }

  function closeImportModal() {
    if (importSubmitting) return;
    setImportModalOpen(false);
    setImportUsersBuffer([]);
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
      const parsedUsers = await parseUsersImportFile(file);
      if (!parsedUsers.length) {
        setImportUsersBuffer([]);
        setImportFileName(file.name);
        setImportError("Arquivo sem linhas válidas para importação.");
        return;
      }

      setImportUsersBuffer(parsedUsers);
      setImportFileName(file.name);
    } catch (error: any) {
      setImportUsersBuffer([]);
      setImportFileName(file.name);
      setImportError(String(error?.message ?? "Falha ao ler o arquivo de importação."));
    }
  }

  async function handleImportSubmit() {
    if (!importUsersBuffer.length) {
      setImportError("Selecione um arquivo CSV ou JSON com usuários antes de importar.");
      return;
    }

    setImportSubmitting(true);
    setImportError(null);

    try {
      const result = await importUsersAdmin({ users: importUsersBuffer });
      setImportResult(result);
      await loadUsers();
    } catch (error: any) {
      const message = error?.response?.data?.message ?? "Não foi possível concluir a importação.";
      setImportError(String(message));
    } finally {
      setImportSubmitting(false);
    }
  }

  function handleDownloadTemplateCsv() {
    const csvTemplate = [
      "nome;sobrenome;email;perfil;status;senha;escola;rede",
      "Joao;Silva;joao.silva@exemplo.com;educator;active;;Escola Exemplo;",
      "Maria;Souza;maria.souza@exemplo.com;consultant;active;;;Rede Sul"
    ].join("\n");

    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo-importacao-usuarios.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
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
    const collegeId = role === "educator" ? (userForm.collegeId === "" ? null : userForm.collegeId) : null;
    const management = userForm.management?.trim() || null;

    if (!firstName || !lastName || !email || !role) {
      setUserModalError("Preencha nome, sobrenome, e-mail e perfil.");
      return;
    }

    if ((role === "consultant" || role === "coordinator" || role === "specialist_consultant") && !management) {
      setUserModalError("Rede é obrigatória para consultor, coordenador e consultor especialista.");
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
          management,
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
          management,
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

  const collegesById = useMemo(() => {
    const map = new Map<number, { id: number; name: string; contractId?: number | null }>();
    colleges.forEach((item) => map.set(item.id, item));
    return map;
  }, [colleges]);

  const filteredColleges = useMemo(() => {
    const selectedContractId = Number(userForm.contractId);
    if (!Number.isFinite(selectedContractId) || selectedContractId <= 0) return colleges;
    return colleges.filter((item) => Number(item.contractId) === selectedContractId);
  }, [colleges, userForm.contractId]);

  useEffect(() => {
    if (userForm.role !== "educator") return;

    const collegeId = Number(userForm.collegeId);
    if (Number.isFinite(collegeId) && collegeId > 0) {
      const college = collegesById.get(collegeId);
      const nextContractId = Number(college?.contractId);
      if (Number.isFinite(nextContractId) && nextContractId > 0 && Number(userForm.contractId) !== nextContractId) {
        setUserForm((prev) => ({ ...prev, contractId: nextContractId }));
      }
      return;
    }

    const selectedContractId = Number(userForm.contractId);
    if (Number.isFinite(selectedContractId) && selectedContractId > 0) return;
    if (userForm.contractId !== "") {
      setUserForm((prev) => ({ ...prev, contractId: "" }));
    }
  }, [collegesById, userForm.collegeId, userForm.contractId, userForm.role]);

  useEffect(() => {
    if (userForm.role !== "educator") return;

    const selectedContractId = Number(userForm.contractId);
    if (!Number.isFinite(selectedContractId) || selectedContractId <= 0) return;

    const selectedCollegeId = Number(userForm.collegeId);
    if (!Number.isFinite(selectedCollegeId) || selectedCollegeId <= 0) return;

    const selectedCollege = collegesById.get(selectedCollegeId);
    if (!selectedCollege || Number(selectedCollege.contractId) !== selectedContractId) {
      setUserForm((prev) => ({ ...prev, collegeId: "" }));
    }
  }, [collegesById, userForm.contractId, userForm.collegeId, userForm.role]);

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
              <button className="sap-top-secondary" onClick={openImportModal}>
                Importar usuários
              </button>
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
              <option value="specialist_consultant">Consultor especialista</option>
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

          <div className="sap-select">
            <select value={managementFilter} onChange={e => setManagementFilter(e.target.value)}>
              <option value="all">Todos os contratos</option>
              <option value={EMPTY_MANAGEMENT_FILTER}>Sem contrato</option>
              {managementOptions.map((management) => (
                <option key={management} value={management}>
                  {management}
                </option>
              ))}
            </select>
          </div>

          <div className="sap-select">
            <select value={inactivityFilter} onChange={e => setInactivityFilter(e.target.value as InactivityFilter)}>
              <option value="all">Inatividade: Todos</option>
              <option value="7">Sem acesso há 7+ dias</option>
              <option value="15">Sem acesso há 15+ dias</option>
              <option value="30">Sem acesso há 30+ dias</option>
              <option value="60">Sem acesso há 60+ dias</option>
              <option value="90">Sem acesso há 90+ dias</option>
              <option value="never">Nunca acessou</option>
            </select>
          </div>

          <div className="sap-select">
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)}>
              <option value="name_asc">Ordem: A-Z</option>
              <option value="name_desc">Ordem: Z-A</option>
              <option value="created_desc">Criação: mais recente</option>
              <option value="created_asc">Criação: mais antiga</option>
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
              {filteredRows.map(u => (
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
                        {u.vacationMode && (
                          <span className="sap-status inactive" style={{ marginLeft: 8 }}>
                            Férias
                          </span>
                        )}
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
          <div className="sap-pagination">
            <div className="sap-pagination-info">
              {pagination.total > 0
                ? `${Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}-${Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )} de ${pagination.total}`
                : "0 resultados"}
            </div>
            <div className="sap-pagination-controls">
              <label className="sap-pagination-size">
                <span>Itens por página</span>
                <select
                  value={String(pagination.pageSize)}
                  onChange={e => {
                    const nextSize = Number(e.target.value);
                    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
                    setPagination(prev => ({ ...prev, page: 1, pageSize: nextSize }));
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
              <button
                className="sap-top-secondary"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={loading || pagination.page <= 1}
              >
                Anterior
              </button>
              <span className="sap-pagination-page">
                Página {pagination.page} de {totalPages}
              </span>
              <button
                className="sap-top-secondary"
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                }
                disabled={loading || pagination.page >= totalPages}
              >
                Próxima
              </button>
            </div>
          </div>
	        </div>

          {openActionsUserId != null &&
            (() => {
              const user = filteredRows.find(r => r.id === openActionsUserId);
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
                  {user.role === "consultant" && (
                    <button
                      className="sap-actions-item"
                      role="menuitem"
                      onClick={() => {
                        setOpenActionsUserId(null);
                        setUserVacationModeAdmin(
                          user.id,
                          !Boolean(user.vacationMode),
                          !Boolean(user.vacationMode) ? "Aproveite seu descanso, nos vemos na volta!" : ""
                        )
                          .then(loadUsers)
                          .catch(err => console.error("Failed to toggle vacation mode:", err));
                      }}
                    >
                      {user.vacationMode ? "Desativar modo férias" : "Ativar modo férias"}
                    </button>
                  )}
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

          {importModalOpen && (
            <div
              className="sap-user-modal-overlay"
              role="dialog"
              aria-modal="true"
              onMouseDown={e => {
                if (e.target === e.currentTarget) closeImportModal();
              }}
            >
              <div className="sap-modal-card sap-import-modal-card">
                <div className="sap-modal-header">
                  <b>Importação em massa de usuários</b>
                  <button
                    className="sap-modal-close"
                    onClick={closeImportModal}
                    aria-label="Fechar"
                    disabled={importSubmitting}
                  >
                    ×
                  </button>
                </div>
                <div className="sap-modal-body">
                  <p className="sap-modal-desc" style={{ marginTop: 0 }}>
                    Envie um arquivo `.csv` ou `.json` com os usuários. Colunas comuns: nome, sobrenome, email, perfil, status, senha, escola, rede.
                  </p>

                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    style={{ display: "none" }}
                    onChange={handleImportFileChange}
                  />

                  <div className="sap-import-actions">
                    <button className="sap-secondary" onClick={triggerImportFileSelect} disabled={importSubmitting}>
                      Selecionar arquivo
                    </button>
                    <button className="sap-secondary" onClick={handleDownloadTemplateCsv} disabled={importSubmitting}>
                      Baixar modelo CSV
                    </button>
                  </div>

                  {importFileName && (
                    <div className="sap-import-meta">
                      <b>Arquivo:</b> {importFileName}
                    </div>
                  )}

                  {importUsersBuffer.length > 0 && (
                    <div className="sap-import-meta">
                      <b>Linhas prontas para importar:</b> {importUsersBuffer.length}
                    </div>
                  )}

                  {importError && <div className="sap-modal-error">{importError}</div>}

                  {importResult && (
                    <div className="sap-import-result">
                      <div className="sap-import-summary">
                        <span>Total: {importResult.summary.total}</span>
                        <span>Criados: {importResult.summary.created}</span>
                        <span>Falhas: {importResult.summary.failed}</span>
                      </div>

                      {importResult.summary.failed > 0 && (
                        <div className="sap-import-failures">
                          {importResult.results
                            .filter(item => !item.success)
                            .slice(0, 10)
                            .map(item => (
                              <div key={`${item.row}-${item.email ?? "sem-email"}`} className="sap-import-failure-row">
                                Linha {item.row} ({item.email ?? "sem e-mail"}): {item.message ?? "Erro"}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="sap-modal-actions">
                  <button className="sap-secondary" onClick={closeImportModal} disabled={importSubmitting}>
                    Fechar
                  </button>
                  <button
                    className="sap-primary"
                    onClick={handleImportSubmit}
                    disabled={importSubmitting || importUsersBuffer.length === 0}
                  >
                    {importSubmitting ? "Importando..." : "Importar agora"}
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
                        onChange={e => {
                          const role = e.target.value as AdminUserRole;
                          setUserForm(s => ({
                            ...s,
                            role,
                            contractId: role === "educator" ? s.contractId : "",
                            collegeId: role === "educator" ? s.collegeId : "",
                          }));
                        }}
                        disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                      >
                        <option value="admin">Administrador</option>
                        <option value="coordinator">Coordenador</option>
                        <option value="specialist_consultant">Consultor especialista</option>
                        <option value="educator">Educador</option>
                        <option value="consultant">Consultor</option>
                      </select>
                    </label>

                    {userForm.role === "educator" && (
                      <label className="sap-user-field">
                        <span>Contrato</span>
                        <select
                          value={userForm.contractId === "" ? "" : String(userForm.contractId)}
                          onChange={e =>
                            setUserForm(s => ({
                              ...s,
                              contractId: e.target.value ? Number(e.target.value) : "",
                              collegeId: "",
                            }))
                          }
                          disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading || contractsLoading}
                        >
                          <option value="">{contractsLoading ? "Carregando..." : "Selecionar"}</option>
                          {contracts.map(c => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {userForm.role === "educator" && (
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
                          {filteredColleges.map(c => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {(userForm.role === "coordinator" || userForm.role === "specialist_consultant" || userForm.role === "consultant" || userForm.role === "educator") && (
                      <label className="sap-user-field">
                        <span>Gerência</span>
                        <input
                          value={userForm.management}
                          onChange={e => setUserForm(s => ({ ...s, management: e.target.value }))}
                          disabled={userModal.mode === "view" || userModalSubmitting || userModalDetailsLoading}
                          placeholder="Ex.: Gerência Sul"
                        />
                      </label>
                    )}

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

async function parseUsersImportFile(file: File): Promise<Array<Record<string, unknown>>> {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  const text = await file.text();
  if (!text.trim()) throw new Error("Arquivo vazio.");

  if (ext === "json") {
    const parsed = JSON.parse(text);
    const users = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.users) ? parsed.users : [];
    if (!Array.isArray(users)) throw new Error("JSON inválido. Esperado array de usuários.");
    return users as Array<Record<string, unknown>>;
  }

  if (ext !== "csv" && ext !== "txt") {
    throw new Error("Formato inválido. Use arquivo .csv ou .json.");
  }

  return parseCsvUsers(text);
}

function parseCsvUsers(text: string): Array<Record<string, unknown>> {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/\r/g, ""))
    .filter(line => line.trim().length > 0);

  if (lines.length < 2) throw new Error("CSV inválido. Informe cabeçalho + pelo menos uma linha.");

  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const separator = detectCsvSeparator(headerLine);
  const headers = parseCsvLine(headerLine, separator).map(normalizeImportHeader);

  if (!headers.length) throw new Error("Cabeçalho do CSV inválido.");

  const users: Array<Record<string, unknown>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator);
    const row: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      if (!header) return;
      row[header] = String(values[index] ?? "").trim();
    });

    const hasValue = Object.values(row).some(value => String(value ?? "").trim().length > 0);
    if (hasValue) users.push(row);
  }

  return users;
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

function normalizeImportHeader(rawHeader: string): string {
  const cleaned = rawHeader.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return "";

  const normalized = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (normalized === "nome") return "firstName";
  if (normalized === "sobrenome") return "lastName";
  if (normalized === "email") return "email";
  if (normalized === "perfil") return "role";
  if (normalized === "status") return "status";
  if (normalized === "senha") return "password";
  if (normalized === "escola" || normalized === "college") return "escola";
  if (normalized === "escolaid" || normalized === "collegeid") return "collegeId";
  if (normalized === "gerencia" || normalized === "regional" || normalized === "rede") return "management";
  if (normalized === "tipodocumento") return "docType";
  if (normalized === "numerodocumento" || normalized === "docid") return "docId";
  if (normalized === "datanascimento") return "birthDate";
  if (normalized === "genero") return "gender";
  if (normalized === "telefone") return "phone";
  if (normalized === "idioma") return "language";

  return cleaned;
}
