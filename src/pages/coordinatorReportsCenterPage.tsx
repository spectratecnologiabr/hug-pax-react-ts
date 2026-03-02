import React, { useEffect, useMemo, useState } from "react";

import CoordinatorMenubar from "../components/coordinator/menubar";
import { listLast30Visits } from "../controllers/admin/listLast30Visits.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { listContracts } from "../controllers/contract/listContracts.controller";
import { listEducators } from "../controllers/user/listEducators.controller";

import "../style/adminReportsCenterPage.css";

type TVisit = {
  id: number;
  collegeId?: number;
  college_id?: number;
  collegeName?: string;
  college_name?: string;
  creatorId?: number;
  creator_id?: number;
  visitDate?: string;
  visit_date?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: string;
};

type TCollege = {
  id: number;
  name: string;
  contractId?: number;
  contract_id?: number;
};

type TContract = {
  id: number;
  name: string;
};

type TEducator = {
  id: number;
  firstName?: string;
  lastName?: string;
  collegeId?: number;
  createdAt?: string;
};

type TReportType = "visit" | "school" | "educator";

type TReportRow = {
  id: string;
  reportType: TReportType;
  sentAt: string;
  schoolId: number | null;
  schoolName: string;
  contractId: number | null;
  contractName: string;
  title: string;
  author: string;
  href: string;
};

function toDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDateTime(value?: string) {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleString("pt-BR");
}

function getRowDate(row: { sentAt: string; [key: string]: unknown }) {
  const date = toDate(row.sentAt);
  return date ? date.getTime() : 0;
}

function normalizeVisits(payload: any): TVisit[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((item: any) => ({
    ...item,
    id: Number(item?.id),
    collegeId: Number(item?.collegeId ?? item?.college_id),
    college_id: Number(item?.college_id ?? item?.collegeId),
    creatorId: Number(item?.creatorId ?? item?.creator_id),
    creator_id: Number(item?.creator_id ?? item?.creatorId),
    collegeName: String(item?.collegeName ?? item?.college_name ?? ""),
    college_name: String(item?.college_name ?? item?.collegeName ?? ""),
    visitDate: String(item?.visitDate ?? item?.visit_date ?? ""),
    visit_date: String(item?.visit_date ?? item?.visitDate ?? ""),
    createdAt: String(item?.createdAt ?? item?.created_at ?? ""),
    created_at: String(item?.created_at ?? item?.createdAt ?? ""),
    updatedAt: String(item?.updatedAt ?? item?.updated_at ?? ""),
    updated_at: String(item?.updated_at ?? item?.updatedAt ?? ""),
  }));
}

function normalizeColleges(payload: any): TCollege[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item: any) => ({
      id: Number(item?.id),
      name: String(item?.name ?? ""),
      contractId: Number(item?.contractId ?? item?.contract_id),
      contract_id: Number(item?.contract_id ?? item?.contractId),
    }))
    .filter((item: TCollege) => Number.isFinite(item.id) && item.id > 0);
}

function normalizeContracts(payload: any): TContract[] {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item: any) => ({ id: Number(item?.id), name: String(item?.name ?? "") }))
    .filter((item: TContract) => Number.isFinite(item.id) && item.id > 0);
}

function normalizeEducators(payload: any): TEducator[] {
  if (!Array.isArray(payload)) return [];
  return payload as TEducator[];
}

function reportTypeLabel(reportType: TReportType) {
  if (reportType === "visit") return "Relatório de visita";
  if (reportType === "school") return "Ficha escolar";
  return "Relatório de educador";
}

function CoordinatorReportsCenterPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visits, setVisits] = useState<TVisit[]>([]);
  const [colleges, setColleges] = useState<TCollege[]>([]);
  const [contracts, setContracts] = useState<TContract[]>([]);
  const [educators, setEducators] = useState<TEducator[]>([]);

  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedContractId, setSelectedContractId] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | TReportType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const [visitsData, collegesData, contractsData, educatorsData] = await Promise.all([
          listLast30Visits(),
          listColleges(),
          listContracts(),
          listEducators(),
        ]);

        if (cancelled) return;

        setVisits(normalizeVisits(visitsData));
        setColleges(normalizeColleges(collegesData));
        setContracts(normalizeContracts(contractsData));
        setEducators(normalizeEducators(educatorsData));
      } catch (e) {
        if (cancelled) return;
        setError("Falha ao carregar a Central de Relatórios.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  const schoolsById = useMemo(() => {
    const map = new Map<number, string>();
    colleges.forEach((college) => {
      map.set(Number(college.id), String(college.name || "").trim());
    });
    return map;
  }, [colleges]);

  const schoolContractById = useMemo(() => {
    const map = new Map<number, number | null>();
    colleges.forEach((college) => {
      const contractId = Number(college.contractId ?? college.contract_id);
      map.set(Number(college.id), Number.isFinite(contractId) && contractId > 0 ? contractId : null);
    });
    return map;
  }, [colleges]);

  const contractsById = useMemo(() => {
    const map = new Map<number, string>();
    contracts.forEach((contract) => {
      map.set(Number(contract.id), String(contract.name || "").trim());
    });
    return map;
  }, [contracts]);

  const rows = useMemo(() => {
    const reportRows: TReportRow[] = [];

    visits.forEach((visit) => {
      const schoolId = Number(visit.collegeId ?? visit.college_id);
      const hasSchoolId = Number.isFinite(schoolId) && schoolId > 0;
      const schoolNameFromVisit = String(
        visit.college_name || visit.collegeName || "Unidade não identificada"
      );
      const schoolName = schoolNameFromVisit || (hasSchoolId ? (schoolsById.get(schoolId) || "Unidade não identificada") : "Unidade não identificada");
      const contractId = hasSchoolId ? schoolContractById.get(schoolId) ?? null : null;
      const contractName = contractId ? (contractsById.get(contractId) || `Contrato #${contractId}`) : "Sem contrato";

      reportRows.push({
        id: `visit-${visit.id}`,
        reportType: "visit",
        sentAt: String(
          visit.updatedAt ||
          visit.updated_at ||
          visit.createdAt ||
          visit.created_at ||
          visit.visitDate ||
          visit.visit_date ||
          ""
        ),
        schoolId: hasSchoolId ? schoolId : null,
        schoolName,
        contractId,
        contractName,
        title: `Relatório de visita #${visit.id}`,
        author: (visit.creatorId || visit.creator_id) ? `Consultor #${visit.creatorId || visit.creator_id}` : "Consultor",
        href: `/coordinator/visits/${visit.id}/report-preview`,
      });
    });

    const schoolLatestDate = new Map<number, string>();
    visits.forEach((visit) => {
      const schoolId = Number(visit.collegeId);
      if (!Number.isFinite(schoolId) || schoolId <= 0) return;
      const candidate = String(visit.updatedAt || visit.createdAt || visit.visitDate || "");
      const previous = schoolLatestDate.get(schoolId) || "";
      if (toDate(candidate) && getRowDate({
        id: "tmp",
        reportType: "school",
        sentAt: candidate,
        schoolId,
        schoolName: "",
        title: "",
        author: "",
        href: "",
      }) > getRowDate({
        id: "tmp2",
        reportType: "school",
        sentAt: previous,
        schoolId,
        schoolName: "",
        title: "",
        author: "",
        href: "",
      })) {
        schoolLatestDate.set(schoolId, candidate);
      }
    });

    schoolLatestDate.forEach((sentAt, schoolId) => {
      const contractId = schoolContractById.get(schoolId) ?? null;
      const contractName = contractId ? (contractsById.get(contractId) || `Contrato #${contractId}`) : "Sem contrato";
      reportRows.push({
        id: `school-${schoolId}`,
        reportType: "school",
        sentAt,
        schoolId,
        schoolName: schoolsById.get(schoolId) || `Escola #${schoolId}`,
        contractId,
        contractName,
        title: "Ficha Escolar (Relatório Final)",
        author: "Consolidado automático",
        href: `/coordinator/colleges/${schoolId}/final-report`,
      });
    });

    educators.forEach((educator) => {
      const schoolId = Number(educator.collegeId);
      const hasSchoolId = Number.isFinite(schoolId) && schoolId > 0;
      const contractId = hasSchoolId ? schoolContractById.get(schoolId) ?? null : null;
      const contractName = contractId ? (contractsById.get(contractId) || `Contrato #${contractId}`) : "Sem contrato";
      const fullName = `${String(educator.firstName || "").trim()} ${String(educator.lastName || "").trim()}`.trim();

      reportRows.push({
        id: `educator-${educator.id}`,
        reportType: "educator",
        sentAt: String(educator.createdAt || ""),
        schoolId: hasSchoolId ? schoolId : null,
        schoolName: hasSchoolId ? (schoolsById.get(schoolId) || `Escola #${schoolId}`) : "Sem escola",
        contractId,
        contractName,
        title: `Relatório de educador: ${fullName || `#${educator.id}`}`,
        author: fullName || `Educador #${educator.id}`,
        href: `/coordinator/educators/${educator.id}/report`,
      });
    });

    return reportRows.sort((a, b) => getRowDate(b) - getRowDate(a));
  }, [visits, educators, schoolsById, schoolContractById, contractsById]);

  const filteredRows = useMemo(() => {
    const contractFilter = selectedContractId === "all" ? null : Number(selectedContractId);
    const schoolSearchNormalized = schoolSearch.trim().toLowerCase();
    const startDateTime = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const endDateTime = endDate ? new Date(`${endDate}T23:59:59.999`) : null;
    const hasStartDate = Boolean(startDateTime && !Number.isNaN(startDateTime.getTime()));
    const hasEndDate = Boolean(endDateTime && !Number.isNaN(endDateTime.getTime()));

    return rows.filter((row) => {
      if (selectedType !== "all" && row.reportType !== selectedType) return false;
      if (contractFilter && row.contractId !== contractFilter) return false;
      if (hasStartDate || hasEndDate) {
        const rowDate = toDate(row.sentAt);
        if (!rowDate) return false;
        if (hasStartDate && rowDate < (startDateTime as Date)) return false;
        if (hasEndDate && rowDate > (endDateTime as Date)) return false;
      }

      if (schoolSearchNormalized) {
        const bySchool = row.schoolName.toLowerCase().includes(schoolSearchNormalized);
        const byTitle = row.title.toLowerCase().includes(schoolSearchNormalized);
        if (!bySchool && !byTitle) return false;
      }

      return true;
    });
  }, [rows, selectedType, selectedContractId, schoolSearch, startDate, endDate]);

  return (
    <div className="admin-dashboard-container reports-center-page">
      <CoordinatorMenubar />

      <main className="reports-center-main">
        <header className="reports-center-header">
          <div>
            <h1>Central de Relatórios</h1>
            <p>
              Visualização consolidada de relatórios de educadores, escolas e visitas dos consultores.
            </p>
          </div>
          <div className="rc-badges">
            <span className="rc-badge">Somente leitura (histórico imutável)</span>
            <span className="rc-badge rc-badge-acess">Hand Talk ativo</span>
          </div>
        </header>

        <section className="rc-filters" aria-label="Filtros da central de relatórios">
          <label>
            <span>Buscar unidade escolar</span>
            <input
              value={schoolSearch}
              onChange={(event) => setSchoolSearch(event.target.value)}
              placeholder="Digite nome da escola"
            />
          </label>

          <label>
            <span>Contrato</span>
            <select value={selectedContractId} onChange={(event) => setSelectedContractId(event.target.value)}>
              <option value="all">Todos</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>{contract.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Tipo de relatório</span>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value as "all" | TReportType)}
            >
              <option value="all">Todos</option>
              <option value="visit">Visitas</option>
              <option value="school">Escolas</option>
              <option value="educator">Educadores</option>
            </select>
          </label>

          <label>
            <span>Data inicial</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label>
            <span>Data final</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </section>

        {loading && <div className="rc-feedback">Carregando relatórios...</div>}
        {!loading && error && <div className="rc-feedback rc-error">{error}</div>}

        {!loading && !error && (
          <section className="rc-table-wrap" aria-label="Listagem cronológica de relatórios enviados">
            <table className="rc-table">
              <thead>
                <tr>
                  <th>Enviado em</th>
                  <th>Tipo</th>
                  <th>Unidade escolar</th>
                  <th>Relatório</th>
                  <th>Responsável</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.sentAt)}</td>
                    <td>{reportTypeLabel(row.reportType)}</td>
                    <td>{row.schoolName}</td>
                    <td>{row.title}</td>
                    <td>{row.author}</td>
                    <td>
                      <a className="rc-view-link" href={row.href}>
                        Visualizar
                      </a>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="rc-empty">Nenhum relatório encontrado para os filtros aplicados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

export default CoordinatorReportsCenterPage;
