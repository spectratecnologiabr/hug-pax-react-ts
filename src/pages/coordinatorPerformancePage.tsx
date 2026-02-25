import React, { useEffect, useMemo, useState } from "react";
import CoordinatorMenubar from "../components/coordinator/menubar";
import Menubar from "../components/admin/menubar";
import { listConsultants } from "../controllers/user/listConsultants.controller";
import { listEducators } from "../controllers/user/listEducators.controller";
import { listColleges } from "../controllers/college/listColleges.controller";
import { listLast30Visits } from "../controllers/admin/listLast30Visits.controller";
import { listVistsThisMonth } from "../controllers/admin/listVisitsThisMonth.controller";
import { listVistsThisWeek } from "../controllers/admin/listVisitsThisWeek.controller";
import { listUsersAdmin } from "../controllers/user/listUsersAdmin.controller";
import { getAdminLogsTimeline } from "../controllers/logs/getAdminLogsTimeline.controller";
import { getLogDashboardList } from "../controllers/logs/getLogDashboardList.controller";

import "../style/coordinatorPerformancePage.css";

type TConsultant = {
  id: number;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  vacationMode?: boolean;
  management?: string;
};

type TEducator = {
  id: number;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  lastAccessAt?: string | null;
  management?: string;
  collegeId?: number;
};

type TCollege = {
  id: number;
  name?: string;
  management?: string;
};

type TVisit = {
  id: number;
  creatorId?: number;
  creator_id?: number;
  collegeId?: number;
  college_id?: number;
  status?: string;
  visitDate?: string;
  visit_date?: string;
};

type TAuditEntry = {
  id: string;
  createdAt: string;
  name: string;
  message: string;
};

function daysSince(value?: string | null) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function parseVisitDate(visit: TVisit) {
  const raw = String(visit.visitDate || visit.visit_date || "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function weekLabel(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const endLabel = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${startLabel} - ${endLabel}`;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(";") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toInt(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatMetric(value?: number) {
  return Number(value ?? 0).toLocaleString("pt-BR");
}

function normalizeVisit(item: any): TVisit {
  return {
    id: toInt(item?.id),
    creatorId: toInt(item?.creatorId ?? item?.creator_id) || undefined,
    creator_id: toInt(item?.creator_id ?? item?.creatorId) || undefined,
    collegeId: toInt(item?.collegeId ?? item?.college_id) || undefined,
    college_id: toInt(item?.college_id ?? item?.collegeId) || undefined,
    status: String(item?.status ?? "").toLowerCase(),
    visitDate: String(item?.visitDate ?? item?.visit_date ?? ""),
    visit_date: String(item?.visit_date ?? item?.visitDate ?? ""),
  };
}

function statusLabel(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "completed") return "Concluída";
  if (s === "scheduled") return "Agendada";
  if (s === "cancelled") return "Cancelada";
  if (s === "rescheduled") return "Remarcada";
  return s || "N/D";
}

function consultantName(consultant: TConsultant) {
  const fullName = `${String(consultant.firstName || "").trim()} ${String(consultant.lastName || "").trim()}`.trim();
  return fullName || `Consultor #${consultant.id}`;
}

function isActiveConsultant(consultant: TConsultant) {
  return Boolean(consultant.isActive) && !consultant.isBlocked;
}

function isVisitDone(status?: string) {
  const s = String(status || "").toLowerCase();
  return s === "completed";
}

function isVisitCancelled(status?: string) {
  const s = String(status || "").toLowerCase();
  return s === "cancelled";
}

function CoordinatorPerformancePage() {
  const isAdminPath = window.location.pathname.startsWith("/admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managementFilter, setManagementFilter] = useState<string>("all");
  const [consultantFilter, setConsultantFilter] = useState<number | "all">("all");

  const [consultants, setConsultants] = useState<TConsultant[]>([]);
  const [educators, setEducators] = useState<TEducator[]>([]);
  const [colleges, setColleges] = useState<TCollege[]>([]);
  const [last30Visits, setLast30Visits] = useState<TVisit[]>([]);
  const [thisMonthVisits, setThisMonthVisits] = useState<TVisit[]>([]);
  const [thisWeekVisits, setThisWeekVisits] = useState<TVisit[]>([]);
  const [auditEntries, setAuditEntries] = useState<TAuditEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const [consultantsData, educatorsData, collegesData, last30Data, thisMonthData, thisWeekData] = await Promise.all([
          listConsultants(),
          listEducators(),
          listColleges(),
          listLast30Visits(),
          listVistsThisMonth(),
          listVistsThisWeek(),
        ]);

        if (cancelled) return;

        setConsultants(Array.isArray(consultantsData) ? consultantsData : []);
        setEducators(Array.isArray(educatorsData) ? educatorsData : []);
        setColleges(Array.isArray(collegesData) ? collegesData : []);
        setLast30Visits(Array.isArray(last30Data) ? last30Data.map(normalizeVisit) : []);
        setThisMonthVisits(Array.isArray(thisMonthData) ? thisMonthData.map(normalizeVisit) : []);
        setThisWeekVisits(Array.isArray(thisWeekData) ? thisWeekData.map(normalizeVisit) : []);

        if (isAdminPath) {
          try {
            const [adminEducatorsData, logsData] = await Promise.all([
              listUsersAdmin({ role: "educator", page: 1, pageSize: 5000 }),
              getAdminLogsTimeline({ limit: 8 }),
            ]);

            if (!cancelled) {
              const educatorItems = Array.isArray((adminEducatorsData as any)?.items)
                ? (adminEducatorsData as any).items
                : Array.isArray(adminEducatorsData)
                  ? adminEducatorsData
                  : [];

              setEducators(educatorItems as TEducator[]);

              const parsedLogs = Array.isArray(logsData)
                ? logsData
                : Array.isArray((logsData as any)?.items)
                  ? (logsData as any).items
                  : [];

              const normalizedLogs: TAuditEntry[] = parsedLogs
                .slice(0, 8)
                .map((item: any, index: number) => ({
                  id: String(item?.id ?? `log-${index}`),
                  createdAt: String(item?.createdAt ?? item?.created_at ?? ""),
                  name: String(item?.name ?? "EVENT"),
                  message: String(item?.message ?? ""),
                }));
              setAuditEntries(normalizedLogs);
            }
          } catch {
            if (!cancelled) setAuditEntries([]);
          }
        } else {
          try {
            const scopedConsultants = Array.isArray(consultantsData) ? consultantsData.slice(0, 8) : [];
            const logResponses = await Promise.all(
              scopedConsultants.map((consultant: any) =>
                getLogDashboardList({ userId: Number(consultant?.id), page: 1, limit: 3 }).catch(() => null)
              )
            );

            if (!cancelled) {
              const allEntries: TAuditEntry[] = [];
              logResponses.forEach((response) => {
                const items = Array.isArray((response as any)?.items)
                  ? (response as any).items
                  : Array.isArray(response)
                    ? response
                    : [];

                items.forEach((item: any, index: number) => {
                  allEntries.push({
                    id: String(item?.id ?? `${index}-${Math.random()}`),
                    createdAt: String(item?.createdAt ?? item?.created_at ?? ""),
                    name: String(item?.name ?? "EVENT"),
                    message: String(item?.message ?? ""),
                  });
                });
              });

              allEntries.sort((a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
              setAuditEntries(allEntries.slice(0, 8));
            }
          } catch {
            if (!cancelled) setAuditEntries([]);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Coordinator performance bootstrap error:", err);
        setError("Não foi possível carregar os dados de performance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isAdminPath]);

  const filteredLast30Visits = useMemo(() => {
    return last30Visits;
  }, [last30Visits]);

  const filteredThisMonthVisits = useMemo(() => thisMonthVisits, [thisMonthVisits]);

  const filteredThisWeekVisits = useMemo(() => thisWeekVisits, [thisWeekVisits]);

  const managementOptions = useMemo(() => {
    const set = new Set<string>();
    consultants.forEach((item) => {
      const mgmt = String(item.management || "").trim();
      if (mgmt) set.add(mgmt);
    });
    colleges.forEach((item) => {
      const mgmt = String(item.management || "").trim();
      if (mgmt) set.add(mgmt);
    });
    educators.forEach((item) => {
      const mgmt = String(item.management || "").trim();
      if (mgmt) set.add(mgmt);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [consultants, colleges, educators]);

  const collegeManagementById = useMemo(() => {
    const map = new Map<number, string>();
    colleges.forEach((college) => {
      const id = toInt(college.id);
      if (id <= 0) return;
      map.set(id, String(college.management || "").trim());
    });
    return map;
  }, [colleges]);

  const consultantsScoped = useMemo(() => {
    if (!isAdminPath || managementFilter === "all") return consultants;
    return consultants.filter((item) => String(item.management || "").trim() === managementFilter);
  }, [consultants, isAdminPath, managementFilter]);

  const collegesScoped = useMemo(() => {
    if (!isAdminPath || managementFilter === "all") return colleges;
    return colleges.filter((item) => String(item.management || "").trim() === managementFilter);
  }, [colleges, isAdminPath, managementFilter]);

  const educatorsScoped = useMemo(() => {
    if (!isAdminPath || managementFilter === "all") return educators;
    return educators.filter((item) => {
      const mgmt = String(item.management || "").trim();
      if (mgmt) return mgmt === managementFilter;
      const collegeId = toInt(item.collegeId);
      if (collegeId <= 0) return false;
      return String(collegeManagementById.get(collegeId) || "") === managementFilter;
    });
  }, [educators, isAdminPath, managementFilter, collegeManagementById]);

  const consultantsScopeSet = useMemo(() => {
    const set = new Set<number>();
    consultantsScoped.forEach((item) => {
      const id = toInt(item.id);
      if (id > 0) set.add(id);
    });
    return set;
  }, [consultantsScoped]);

  const collegesScopeSet = useMemo(() => {
    const set = new Set<number>();
    collegesScoped.forEach((item) => {
      const id = toInt(item.id);
      if (id > 0) set.add(id);
    });
    return set;
  }, [collegesScoped]);

  const visitsByScope = useMemo(() => {
    const filterByScope = (visit: TVisit) => {
      if (isAdminPath && managementFilter !== "all") {
        const consultantId = toInt(visit.creatorId ?? visit.creator_id);
        const collegeId = toInt(visit.collegeId ?? visit.college_id);
        return consultantsScopeSet.has(consultantId) || collegesScopeSet.has(collegeId);
      }
      return true;
    };

    const byConsultant = (visit: TVisit) => {
      if (consultantFilter === "all") return true;
      return toInt(visit.creatorId ?? visit.creator_id) === consultantFilter;
    };

    const last30 = filteredLast30Visits.filter((visit) => filterByScope(visit) && byConsultant(visit));
    const thisMonth = filteredThisMonthVisits.filter((visit) => filterByScope(visit) && byConsultant(visit));
    const thisWeek = filteredThisWeekVisits.filter((visit) => filterByScope(visit) && byConsultant(visit));

    return { last30, thisMonth, thisWeek };
  }, [
    isAdminPath,
    managementFilter,
    consultantFilter,
    consultantsScopeSet,
    collegesScopeSet,
    filteredLast30Visits,
    filteredThisMonthVisits,
    filteredThisWeekVisits,
  ]);

  const summary = useMemo(() => {
    const activeConsultants = consultantsScoped.filter(isActiveConsultant).length;
    const consultantsOnVacation = consultantsScoped.filter((item) => Boolean(item.vacationMode)).length;

    const visitedSchoolIds = new Set<number>();
    visitsByScope.last30.forEach((visit) => {
      const schoolId = toInt(visit.collegeId ?? visit.college_id);
      if (schoolId > 0) visitedSchoolIds.add(schoolId);
    });

    const schoolsWithoutRecentVisit = Math.max(0, collegesScoped.length - visitedSchoolIds.size);

    const weekTotal = visitsByScope.thisWeek.length;
    const weekCompleted = visitsByScope.thisWeek.filter((item) => isVisitDone(item.status)).length;
    const weekCancelled = visitsByScope.thisWeek.filter((item) => isVisitCancelled(item.status)).length;
    const weekCompletionRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
    const weekCancellationRate = weekTotal > 0 ? Math.round((weekCancelled / weekTotal) * 100) : 0;

    const monthTotal = visitsByScope.thisMonth.length;
    const monthCompleted = visitsByScope.thisMonth.filter((item) => isVisitDone(item.status)).length;

    return {
      activeConsultants,
      consultantsOnVacation,
      totalEducators: educatorsScoped.length,
      totalSchools: collegesScoped.length,
      schoolsWithoutRecentVisit,
      weekTotal,
      weekCompleted,
      weekCompletionRate,
      weekCancellationRate,
      monthTotal,
      monthCompleted,
    };
  }, [consultantsScoped, educatorsScoped.length, collegesScoped.length, visitsByScope,]);

  const accessMetrics = useMemo(() => {
    const total = educatorsScoped.length;
    if (!total) {
      return {
        active7d: 0,
        active30d: 0,
        inactive14d: 0,
        rate7d: 0,
        rate30d: 0,
        deltaRate: 0,
      };
    }

    let active7d = 0;
    let active30d = 0;
    let inactive14d = 0;

    educatorsScoped.forEach((educator) => {
      const days = daysSince(educator.lastAccessAt);
      if (days === null) {
        inactive14d += 1;
        return;
      }
      if (days <= 7) active7d += 1;
      if (days <= 30) active30d += 1;
      if (days > 14) inactive14d += 1;
    });

    const rate7d = Math.round((active7d / total) * 100);
    const rate30d = Math.round((active30d / total) * 100);
    const deltaRate = rate7d - rate30d;

    return { active7d, active30d, inactive14d, rate7d, rate30d, deltaRate };
  }, [educatorsScoped]);

  const consultantRanking = useMemo(() => {
    const statsByConsultant = new Map<number, { total: number; completed: number; cancelled: number }>();

    visitsByScope.last30.forEach((visit) => {
      const consultantId = toInt(visit.creatorId ?? visit.creator_id);
      if (consultantId <= 0) return;

      const prev = statsByConsultant.get(consultantId) ?? { total: 0, completed: 0, cancelled: 0 };
      prev.total += 1;
      if (isVisitDone(visit.status)) prev.completed += 1;
      if (isVisitCancelled(visit.status)) prev.cancelled += 1;
      statsByConsultant.set(consultantId, prev);
    });

    return consultantsScoped
      .filter((consultant) => consultantFilter === "all" || consultant.id === consultantFilter)
      .map((consultant) => {
        const stats = statsByConsultant.get(consultant.id) ?? { total: 0, completed: 0, cancelled: 0 };
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        return {
          id: consultant.id,
          name: consultantName(consultant),
          total: stats.total,
          completed: stats.completed,
          cancelled: stats.cancelled,
          completionRate,
        };
      })
      .sort((a, b) => (b.completionRate - a.completionRate) || (b.completed - a.completed) || (b.total - a.total));
  }, [consultantsScoped, visitsByScope.last30, consultantFilter]);

  const schoolsById = useMemo(() => {
    const map = new Map<number, string>();
    colleges.forEach((college) => {
      const id = toInt(college.id);
      if (id > 0) map.set(id, String(college.name || `Escola #${id}`));
    });
    return map;
  }, [colleges]);

  const schoolRanking = useMemo(() => {
    const statsBySchool = new Map<number, { total: number; completed: number; cancelled: number }>();

    visitsByScope.last30.forEach((visit) => {
      const schoolId = toInt(visit.collegeId ?? visit.college_id);
      if (schoolId <= 0) return;
      const prev = statsBySchool.get(schoolId) ?? { total: 0, completed: 0, cancelled: 0 };
      prev.total += 1;
      if (isVisitDone(visit.status)) prev.completed += 1;
      if (isVisitCancelled(visit.status)) prev.cancelled += 1;
      statsBySchool.set(schoolId, prev);
    });

    return Array.from(statsBySchool.entries())
      .map(([id, stats]) => ({
        id,
        school: schoolsById.get(id) || `Escola #${id}`,
        total: stats.total,
        completed: stats.completed,
        cancelled: stats.cancelled,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => (b.completionRate - a.completionRate) || (b.total - a.total))
      .slice(0, 8);
  }, [visitsByScope.last30, schoolsById]);

  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);
    const weekStarts: Date[] = [];
    for (let i = 3; i >= 0; i -= 1) {
      const week = new Date(currentWeekStart);
      week.setDate(currentWeekStart.getDate() - (i * 7));
      weekStarts.push(week);
    }

    const keyed = new Map<string, { key: string; label: string; total: number; completed: number; cancelled: number }>();
    weekStarts.forEach((week) => {
      const key = week.toISOString().slice(0, 10);
      keyed.set(key, { key, label: weekLabel(week), total: 0, completed: 0, cancelled: 0 });
    });

    visitsByScope.last30.forEach((visit) => {
      const date = parseVisitDate(visit);
      if (!date) return;
      const key = startOfWeek(date).toISOString().slice(0, 10);
      const item = keyed.get(key);
      if (!item) return;
      item.total += 1;
      if (isVisitDone(visit.status)) item.completed += 1;
      if (isVisitCancelled(visit.status)) item.cancelled += 1;
    });

    return Array.from(keyed.values()).map((item) => ({
      ...item,
      completionRate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    }));
  }, [visitsByScope.last30]);

  const statusDistribution = useMemo(() => {
    const grouped = new Map<string, number>();
    visitsByScope.last30.forEach((visit) => {
      const status = String(visit.status || "unknown");
      grouped.set(status, (grouped.get(status) ?? 0) + 1);
    });

    const total = visitsByScope.last30.length || 1;
    return Array.from(grouped.entries())
      .map(([status, count]) => ({
        status,
        label: statusLabel(status),
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitsByScope.last30]);

  const alerts = useMemo(() => {
    const items: string[] = [];

    if (summary.weekCancellationRate >= 20) {
      items.push(`Taxa de cancelamento na semana está em ${summary.weekCancellationRate}% (acima do limite de 20%).`);
    }

    if (summary.schoolsWithoutRecentVisit > 0) {
      items.push(`${summary.schoolsWithoutRecentVisit} escola(s) sem visita nos últimos 30 dias.`);
    }

    const consultantsWithoutCompletion = consultantRanking
      .filter((item) => item.total > 0 && item.completed === 0)
      .map((item) => item.name);

    if (consultantsWithoutCompletion.length > 0) {
      items.push(`Consultor(es) com visitas e nenhuma conclusão no período: ${consultantsWithoutCompletion.join(", ")}.`);
    }

    if (items.length === 0) {
      items.push("Sem alertas críticos no recorte atual.");
    }

    return items;
  }, [summary.weekCancellationRate, summary.schoolsWithoutRecentVisit, consultantRanking]);

  const riskRanking = useMemo(() => {
    const rows = educatorsScoped.map((educator) => {
      const days = daysSince(educator.lastAccessAt);
      const collegeId = toInt(educator.collegeId);
      const hasRecentVisit = collegeId > 0 && visitsByScope.last30.some((visit) => toInt(visit.collegeId ?? visit.college_id) === collegeId);
      const name = `${String(educator.firstName || "").trim()} ${String(educator.lastName || "").trim()}`.trim() || `Educador #${educator.id}`;

      let score = 0;
      const reasons: string[] = [];

      if (days === null) {
        score += 70;
        reasons.push("Sem registro de acesso");
      } else if (days > 30) {
        score += 70;
        reasons.push(`Sem acesso há ${days} dias`);
      } else if (days > 14) {
        score += 50;
        reasons.push(`Sem acesso há ${days} dias`);
      } else if (days > 7) {
        score += 25;
        reasons.push(`Acesso baixo (${days} dias)`);
      }

      if (!hasRecentVisit) {
        score += 20;
        reasons.push("Escola sem visita recente");
      }

      return {
        id: educator.id,
        name,
        score: Math.min(100, score),
        reason: reasons.join(" | ") || "Sem risco relevante",
      };
    });

    return rows
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [educatorsScoped, visitsByScope.last30]);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    if (summary.weekCancellationRate >= 20) recs.push("Revisar agenda da semana e bloquear remarcações em massa.");
    if (summary.schoolsWithoutRecentVisit > 0) recs.push(`Priorizar ${summary.schoolsWithoutRecentVisit} escola(s) sem visita em 30 dias.`);
    if (accessMetrics.inactive14d > 0) recs.push(`Acionar plano de reengajamento para ${accessMetrics.inactive14d} educador(es) sem acesso recente.`);
    if (recs.length === 0) recs.push("Manter rotina atual e monitorar evolução semanal.");
    return recs.slice(0, 4);
  }, [summary.weekCancellationRate, summary.schoolsWithoutRecentVisit, accessMetrics.inactive14d]);

  function exportPerformanceCsv() {
    const lines: string[] = [];
    lines.push("secao;chave;valor");
    lines.push(`kpi;consultores_ativos;${summary.activeConsultants}`);
    lines.push(`kpi;consultores_ferias;${summary.consultantsOnVacation}`);
    lines.push(`kpi;educadores_total;${summary.totalEducators}`);
    lines.push(`kpi;escolas_total;${summary.totalSchools}`);
    lines.push(`kpi;escolas_sem_visita_30d;${summary.schoolsWithoutRecentVisit}`);
    lines.push(`kpi;visitas_semana;${summary.weekTotal}`);
    lines.push(`kpi;taxa_conclusao_semana;${summary.weekCompletionRate}%`);
    lines.push(`kpi;visitas_mes;${summary.monthTotal}`);
    lines.push("");

    lines.push("ranking_consultor;consultor;visitas;concluidas;canceladas;taxa_conclusao");
    consultantRanking.forEach((item) => {
      lines.push([
        "ranking_consultor",
        csvEscape(item.name),
        item.total,
        item.completed,
        item.cancelled,
        `${item.completionRate}%`,
      ].join(";"));
    });
    lines.push("");

    lines.push("ranking_escola;escola;visitas;concluidas;canceladas;taxa_conclusao");
    schoolRanking.forEach((item) => {
      lines.push([
        "ranking_escola",
        csvEscape(item.school),
        item.total,
        item.completed,
        item.cancelled,
        `${item.completionRate}%`,
      ].join(";"));
    });
    lines.push("");

    lines.push("evolucao_semanal;semana;visitas;concluidas;canceladas;taxa_conclusao");
    weeklyTrend.forEach((item) => {
      lines.push([
        "evolucao_semanal",
        csvEscape(item.label),
        item.total,
        item.completed,
        item.cancelled,
        `${item.completionRate}%`,
      ].join(";"));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    link.href = url;
    link.download = `performance-rede-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-dashboard-container coordinator-performance-page">
      {isAdminPath ? <Menubar /> : <CoordinatorMenubar />}

      <div className="admin-dashboard-wrapper coordinator-performance-wrapper">
        <div className="admin-header-wrapper">
          <div>
            <b>Performance de Consultores</b>
            <span>Visão operacional com ranking de consultores, distribuição de visitas e alertas acionáveis.</span>
          </div>
          <div className="cpf-header-actions">
            {isAdminPath && (
              <div className="cpf-filter">
                <label htmlFor="managementFilter">Rede</label>
                <select
                  id="managementFilter"
                  value={managementFilter}
                  onChange={(event) => {
                    setManagementFilter(event.target.value);
                    setConsultantFilter("all");
                  }}
                >
                  <option value="all">Todas</option>
                  {managementOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="cpf-filter">
              <label htmlFor="consultantFilter">Consultor</label>
              <select
                id="consultantFilter"
                value={String(consultantFilter)}
                onChange={(event) => {
                  const value = event.target.value;
                  setConsultantFilter(value === "all" ? "all" : Number(value));
                }}
              >
                <option value="all">Todos</option>
                {consultantsScoped.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultantName(consultant)}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="cpf-export-btn" onClick={exportPerformanceCsv}>
              Exportar CSV
            </button>
          </div>
        </div>

        {error && <div className="cpf-error">{error}</div>}

        <div className="cpf-grid-kpi">
          <article className="cpf-kpi-card">
            <span>Consultores Ativos</span>
            <b>{loading ? "—" : formatMetric(summary.activeConsultants)}</b>
            <small>Em férias: {loading ? "—" : formatMetric(summary.consultantsOnVacation)}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Educadores (Rede)</span>
            <b>{loading ? "—" : formatMetric(summary.totalEducators)}</b>
            <small>Escolas: {loading ? "—" : formatMetric(summary.totalSchools)}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Visitas na Semana</span>
            <b>{loading ? "—" : formatMetric(summary.weekTotal)}</b>
            <small>Conclusão: {loading ? "—" : `${summary.weekCompletionRate}%`}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Visitas no Mês</span>
            <b>{loading ? "—" : formatMetric(summary.monthTotal)}</b>
            <small>Concluídas: {loading ? "—" : formatMetric(summary.monthCompleted)}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Consultores Inativos</span>
            <b>{loading ? "—" : formatMetric(Math.max(0, consultantsScoped.length - summary.activeConsultants))}</b>
            <small>Total: {loading ? "—" : formatMetric(consultantsScoped.length)}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Engajamento 7d vs 30d</span>
            <b>{loading ? "—" : `${accessMetrics.rate7d}%`}</b>
            <small>{loading ? "—" : `${accessMetrics.rate30d}% em 30d (${accessMetrics.deltaRate >= 0 ? "+" : ""}${accessMetrics.deltaRate}pp)`}</small>
          </article>
          <article className="cpf-kpi-card">
            <span>Educadores sem acesso (&gt;14d)</span>
            <b>{loading ? "—" : formatMetric(accessMetrics.inactive14d)}</b>
            <small>Ativos 7d: {loading ? "—" : formatMetric(accessMetrics.active7d)}</small>
          </article>
        </div>

        <div className="cpf-grid-main">
          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Ranking de Consultores (30 dias)</b>
            </div>
            <div className="cpf-table-wrap">
              <table className="cpf-table">
                <thead>
                  <tr>
                    <th>Consultor</th>
                    <th>Visitas</th>
                    <th>Concluídas</th>
                    <th>Canceladas</th>
                    <th>Taxa de conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5}>Carregando...</td>
                    </tr>
                  )}
                  {!loading && consultantRanking.length === 0 && (
                    <tr>
                      <td colSpan={5}>Sem dados no período.</td>
                    </tr>
                  )}
                  {!loading && consultantRanking.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{formatMetric(item.total)}</td>
                      <td>{formatMetric(item.completed)}</td>
                      <td>{formatMetric(item.cancelled)}</td>
                      <td>{item.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Distribuição por Status (30 dias)</b>
            </div>
            <div className="cpf-bars">
              {loading && <p>Carregando...</p>}
              {!loading && statusDistribution.length === 0 && <p>Sem dados no período.</p>}
              {!loading && statusDistribution.map((item) => (
                <div key={item.status} className="cpf-bar-row">
                  <div className="cpf-bar-label">{item.label}</div>
                  <div className="cpf-bar-track">
                    <div className="cpf-bar-fill" style={{ width: `${Math.max(4, item.percentage)}%` }} />
                  </div>
                  <div className="cpf-bar-value">{item.count} ({item.percentage}%)</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="cpf-grid-main">
          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Evolução Semanal (4 semanas)</b>
            </div>
            <div className="cpf-table-wrap">
              <table className="cpf-table">
                <thead>
                  <tr>
                    <th>Semana</th>
                    <th>Visitas</th>
                    <th>Concluídas</th>
                    <th>Canceladas</th>
                    <th>Taxa de conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5}>Carregando...</td>
                    </tr>
                  )}
                  {!loading && weeklyTrend.map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      <td>{formatMetric(item.total)}</td>
                      <td>{formatMetric(item.completed)}</td>
                      <td>{formatMetric(item.cancelled)}</td>
                      <td>{item.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Ranking de Escolas (30 dias)</b>
            </div>
            <div className="cpf-table-wrap">
              <table className="cpf-table">
                <thead>
                  <tr>
                    <th>Escola</th>
                    <th>Visitas</th>
                    <th>Concluídas</th>
                    <th>Taxa de conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4}>Carregando...</td>
                    </tr>
                  )}
                  {!loading && schoolRanking.length === 0 && (
                    <tr>
                      <td colSpan={4}>Sem dados no período.</td>
                    </tr>
                  )}
                  {!loading && schoolRanking.map((item) => (
                    <tr key={item.id}>
                      <td>{item.school}</td>
                      <td>{formatMetric(item.total)}</td>
                      <td>{formatMetric(item.completed)}</td>
                      <td>{item.completionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="cpf-panel">
          <div className="cpf-panel-header">
            <b>Alertas Operacionais</b>
          </div>
          <ul className="cpf-alerts">
            {loading ? (
              <li>Carregando...</li>
            ) : (
              alerts.map((alert, index) => <li key={index}>{alert}</li>)
            )}
          </ul>
        </section>

        <div className="cpf-grid-main">
          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Risco Heurístico (Educadores)</b>
            </div>
            <div className="cpf-table-wrap">
              <table className="cpf-table">
                <thead>
                  <tr>
                    <th>Educador</th>
                    <th>Score</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={3}>Carregando...</td>
                    </tr>
                  )}
                  {!loading && riskRanking.length === 0 && (
                    <tr>
                      <td colSpan={3}>Sem dados suficientes.</td>
                    </tr>
                  )}
                  {!loading && riskRanking.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.score}</td>
                      <td>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cpf-panel">
            <div className="cpf-panel-header">
              <b>Próximas Ações Recomendadas</b>
            </div>
            <ul className="cpf-alerts">
              {loading ? (
                <li>Carregando...</li>
              ) : (
                recommendations.map((item, index) => <li key={index}>{item}</li>)
              )}
            </ul>
          </section>
        </div>

        <section className="cpf-panel">
          <div className="cpf-panel-header">
            <b>Auditoria Visível</b>
          </div>
          <div className="cpf-table-wrap">
            <table className="cpf-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Evento</th>
                  <th>Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3}>Carregando...</td>
                  </tr>
                )}
                {!loading && auditEntries.length === 0 && (
                  <tr>
                    <td colSpan={3}>Sem registros de auditoria no recorte atual.</td>
                  </tr>
                )}
                {!loading && auditEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString("pt-BR") : "-"}</td>
                    <td>{entry.name}</td>
                    <td>{entry.message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CoordinatorPerformancePage;
