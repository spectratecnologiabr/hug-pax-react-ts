import React, { useEffect, useMemo, useState } from "react";

import Menubar from "../components/admin/menubar";

import "../style/seriesAdminPage.css";
import EducationCreateModal from "../components/admin/educationCreateModal";

import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";
import { listTeachingGradesAdmin } from "../controllers/education/listTeachingGradesAdmin.controller";

type NodeType = "group" | "series";

type TreeNode = {
  id: string;
  label: string;
  students?: number;
  type: NodeType;
  children?: TreeNode[];
};

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean };
type TeachingGrade = { id: number; modalityId: number; name: string; order: number; isActive?: boolean };

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg className={"sap-ico" + (open ? " sap-ico-rot" : "")} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className="sap-ico sap-ico-folder" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
      <path d="M3.5 7.5c0-1.1.9-2 2-2h4.4c.5 0 1 .2 1.4.6l1 1c.4.4.9.6 1.4.6H18.5c1.1 0 2 .9 2 2v7.3c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2V7.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 9h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="sap-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function clampInt(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : fallback;
}

function formatStudents(n?: number) {
  const v = clampInt(n, 0);
  return `${v} alunos`;
}

function buildFilteredTree(nodes: TreeNode[], query: string, modality: string): TreeNode[] {
  const q = query.trim().toLowerCase();

  const modalityPass = (node: TreeNode): boolean => {
    if (modality === "all") return true;
    if (node.id === modality) return true;
    if (node.children && node.children.some(modalityPass)) return true;
    return false;
  };

  const queryPass = (node: TreeNode): boolean => {
    if (!q) return true;
    if (node.label.toLowerCase().includes(q)) return true;
    if (node.children && node.children.some(queryPass)) return true;
    return false;
  };

  const prune = (node: TreeNode): TreeNode | null => {
    if (!modalityPass(node) || !queryPass(node)) return null;

    if (!node.children || node.children.length === 0) return node;

    const kids = node.children
      .map(prune)
      .filter(Boolean) as TreeNode[];

    return { ...node, children: kids };
  };

  return nodes
    .map(prune)
    .filter(Boolean) as TreeNode[];
}

function SeriesAdminPage() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [apiModalities, setApiModalities] = useState<TeachingModality[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [seriesSearch, setSeriesSearch] = useState("");
  const [modality, setModality] = useState<string>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    fundamental: true,
    "fundamental-1a5": true,
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const buildTreeFromApi = (modalities: TeachingModality[], gradesByModality: Record<number, TeachingGrade[]>) => {
    return modalities.map((m) => {
      const grades = (gradesByModality[m.id] || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return {
        id: String(m.id),
        label: m.name,
        type: "group" as const,
        children: grades.map((g) => ({ id: `grade-${g.id}`, label: g.name, type: "series" as const }))
      };
    });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTree(true);
        setTreeError(null);
        const modalitiesResp = await listTeachingModalitiesAdmin();
        const modalities: TeachingModality[] = Array.isArray(modalitiesResp?.data) ? modalitiesResp.data : modalitiesResp;
        const activeModalities = (modalities || []).filter((m) => m.isActive !== false);
        const gradesEntries = await Promise.all(
          activeModalities.map(async (m) => {
            const gradesResp = await listTeachingGradesAdmin(m.id);
            const grades: TeachingGrade[] = Array.isArray(gradesResp?.data) ? gradesResp.data : gradesResp;
            return [m.id, (grades || []).filter((g) => g.isActive !== false)] as const;
          })
        );
        const gradesByModality: Record<number, TeachingGrade[]> = {};
        gradesEntries.forEach(([mid, grades]) => {
          gradesByModality[mid] = grades;
        });
        if (!alive) return;
        setApiModalities(activeModalities);
        setTree(buildTreeFromApi(activeModalities, gradesByModality));
        setOpenIds((s) => {
          const next: Record<string, boolean> = { ...s };
          activeModalities.forEach((m) => {
            const id = String(m.id);
            if (next[id] === undefined) next[id] = true;
          });
          return next;
        });
      } catch {
        if (!alive) return;
        setTreeError("Não consegui carregar modalidades e séries.");
        setApiModalities([]);
        setTree([]);
      } finally {
        if (!alive) return;
        setLoadingTree(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const filteredTree = useMemo(
    () => buildFilteredTree(tree, seriesSearch, modality),
    [tree, seriesSearch, modality]
  );

  const toggle = (id: string) =>
    setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  const openAllFromFilter = () => {
    // UX: quando filtra, abre tudo do resultado.
    const next: Record<string, boolean> = {};
    const walk = (n: TreeNode) => {
      if (n.type === "group") next[n.id] = true;
      n.children?.forEach(walk);
    };
    filteredTree.forEach(walk);
    setOpenIds((s) => ({ ...s, ...next }));
  };

  const handleSeriesSearch = (v: string) => {
    setSeriesSearch(v);
    // abre os nós para não “sumir” o resultado
    setTimeout(() => openAllFromFilter(), 0);
  };

  const handleCreateSeries = () => setOpenCreate(true);

  const renderNode = (node: TreeNode, level: number) => {
    const hasChildren = !!node.children && node.children.length > 0;
    const isOpen = !!openIds[node.id];

    const rowClass =
      "sap-tree-row" +
      (node.type === "group" ? " sap-tree-row-group" : " sap-tree-row-leaf") +
      (level === 0 ? " sap-tree-row-root" : "");

    return (
      <div key={node.id} className="sap-tree-item">
        <div className={rowClass} style={{ paddingLeft: `${16 + level * 28}px` }} >
          <div className="sap-tree-left">
            {hasChildren ? (
              <button type="button" className="sap-tree-toggle" onClick={() => toggle(node.id)} aria-label={isOpen ? "Recolher" : "Expandir"} >
                <IconChevron open={isOpen} />
              </button>
            ) : (
              <span className="sap-tree-toggle sap-tree-toggle-placeholder" />
            )}

            {node.type === "series" ? <IconFolder /> : null}

            <span className="sap-tree-label">{node.label}</span>
          </div>

        </div>

        {hasChildren && isOpen ? (
          <div className="sap-tree-children">
            {node.children!.map((c) => renderNode(c, level + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="admin-dashboard-container">
        <Menubar />
        <div className="admin-dashboard-wrapper sap-page">
          <div className="admin-header-wrapper">
            <div >
              <b>Séries e Modalidades</b>
              <span>Organize a estrutura escolar</span>
            </div>

            <div className="sap-top-actions">
              <button className="sap-primary" type="button" onClick={handleCreateSeries}>
                + Nova Série
              </button>
            </div>
          </div>

          <div className="sap-filters">
            <div className="sap-input sap-input-wide">
              <IconSearch />
              <input value={seriesSearch} onChange={(e) => handleSeriesSearch(e.target.value)} placeholder="Buscar séries..." />
            </div>

            <div className="sap-select">
            <select value={modality} onChange={(e) => { setModality(e.target.value); setTimeout(() => openAllFromFilter(), 0); }} aria-label="Filtrar por modalidade" >
              <option value="all">Todas as modalidades</option>
              {apiModalities.map((m) => (
                  <option key={m.id} value={String(m.id)}>{m.name}</option>
                ))}
            </select>
            </div>
          </div>

          <div className="sap-card">
            <div className="sap-card-header">
              <b>Estrutura Escolar</b>
            </div>

          <div className="sap-tree">
            {loadingTree ? (
                <div className="sap-empty"><b>Carregando...</b><span>Buscando modalidades e séries.</span></div>
              ) : treeError ? (
                <div className="sap-empty"><b>Ops</b><span>{treeError}</span></div>
              ) : filteredTree.length ? (
                filteredTree.map((n) => renderNode(n, 0))
              ) : (
                <div className="sap-empty"><b>Nada por aqui</b><span>Tenta ajustar a busca ou o filtro de modalidade.</span></div>
              )}
          </div>
          </div>
          <EducationCreateModal opened={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => setRefreshKey((k) => k + 1)} defaultTab="grade" />
        </div>
      </div>
    </React.Fragment>
  );
}

export default SeriesAdminPage;