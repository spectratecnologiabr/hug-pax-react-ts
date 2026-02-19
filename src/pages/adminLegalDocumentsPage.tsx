import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Menubar from "../components/admin/menubar";
import { createLegalDocumentAdmin } from "../controllers/legalDocuments/createLegalDocumentAdmin.controller";
import { listLegalDocumentsAdmin } from "../controllers/legalDocuments/listLegalDocumentsAdmin.controller";
import { publishLegalDocumentAdmin } from "../controllers/legalDocuments/publishLegalDocumentAdmin.controller";
import { updateLegalDocumentAdmin } from "../controllers/legalDocuments/updateLegalDocumentAdmin.controller";
import "../style/adminCommunication.css";
import "../style/adminLegalDocumentsPage.css";

type LegalDocumentType = "terms" | "privacy";
type LegalDocument = {
  id: number;
  documentType: LegalDocumentType;
  version: number;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string | null;
  updatedAt?: string;
};

function decodeEscapedHtml(value: string) {
  const input = String(value || "");
  if (!input) return "";
  const hasHtmlTag = /<\s*[a-z!/]/i.test(input);
  const looksEscapedHtml = /&lt;\s*[a-z!/]/i.test(input);
  if (!hasHtmlTag && looksEscapedHtml) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = input;
    return textarea.value;
  }
  return input;
}

function normalizeRow(raw: any): LegalDocument {
  const contentValue =
    raw?.content ??
    raw?.documentContent ??
    raw?.document_content ??
    raw?.body ??
    "";

  return {
    id: Number(raw?.id ?? 0),
    documentType: (raw?.documentType ?? raw?.document_type ?? "terms") as LegalDocumentType,
    version: Number(raw?.version ?? 0),
    title: String(raw?.title ?? ""),
    content: decodeEscapedHtml(String(contentValue ?? "")),
    isPublished: Boolean(raw?.isPublished ?? raw?.is_published),
    publishedAt: raw?.publishedAt ?? raw?.published_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? undefined
  };
}

function typeLabel(type: LegalDocumentType) {
  return type === "terms" ? "Termos de Uso" : "Política de Privacidade";
}

function stripHtml(value: string) {
  if (!value) return "";
  const doc = new DOMParser().parseFromString(value, "text/html");
  return (doc.body.textContent || "").trim();
}

function RichTextToolbar({ editor, disabled }: { editor: any; disabled?: boolean }) {
  if (!editor) return null;

  return (
    <div className="sap-editor-toolbar">
      <button
        type="button"
        title="Negrito"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
      >
        B
      </button>
      <button
        type="button"
        title="Itálico"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
      >
        I
      </button>
      <button
        type="button"
        title="Lista com marcadores"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active" : ""}
      >
        • Lista
      </button>
      <button
        type="button"
        title="Lista numerada"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active" : ""}
      >
        1. Lista
      </button>
      <button
        type="button"
        title="Inserir link"
        disabled={disabled}
        onClick={() => {
          const url = window.prompt("Link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </button>
      <button
        type="button"
        title="Remover link"
        disabled={disabled}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        Remover link
      </button>
    </div>
  );
}

function AdminLegalDocumentsPage() {
  const [rows, setRows] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<LegalDocumentType | "all">("all");
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formType, setFormType] = useState<LegalDocumentType>("terms");
  const [publishNow, setPublishNow] = useState(true);
  const [resetAcceptance, setResetAcceptance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content,
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(modalMode !== "view");
  }, [editor, modalMode]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "<p></p>", { emitUpdate: false });
    }
  }, [editor, content]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listLegalDocumentsAdmin();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setRows(list.map((item: any) => normalizeRow(item)));
    } catch {
      setRows([]);
      setError("Não foi possível carregar os documentos de LGPD.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (selectedType === "all") return rows;
    return rows.filter((row) => row.documentType === selectedType);
  }, [rows, selectedType]);

  const publishedRow = useMemo(() => {
    return filteredRows.find((row) => row.isPublished) || null;
  }, [filteredRows]);

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setFormType(selectedType === "all" ? "terms" : selectedType);
    setTitle("");
    setContent("");
    setPublishNow(true);
    setResetAcceptance(true);
    setOpenModal(true);
    if (editor) {
      editor.commands.setContent("<p></p>", { emitUpdate: false });
    }
  }

  function openEdit(row: LegalDocument, mode: "edit" | "view" = "edit") {
    const normalizedContent = decodeEscapedHtml(String(row.content || ""));
    setModalMode(mode);
    setEditingId(row.id);
    setFormType(row.documentType);
    setTitle(row.title);
    setContent(normalizedContent);
    setPublishNow(!row.isPublished);
    setResetAcceptance(true);
    setOpenModal(true);
    if (editor) {
      editor.commands.setContent(normalizedContent || "<p></p>", { emitUpdate: false });
    }
  }

  function closeModal() {
    if (saving) return;
    setOpenModal(false);
    setModalMode("create");
    setEditingId(null);
    setFormType(selectedType === "all" ? "terms" : selectedType);
    setTitle("");
    setContent("");
    setPublishNow(true);
    setResetAcceptance(true);
  }

  async function handleSave() {
    if (!title.trim() || !stripHtml(content)) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateLegalDocumentAdmin(editingId, { title: title.trim(), content });
        if (publishNow) {
          await publishLegalDocumentAdmin(editingId);
        }
      } else {
        await createLegalDocumentAdmin({
          documentType: formType,
          title: title.trim(),
          content,
          publish: publishNow
        });
      }
      closeModal();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: number) {
    await publishLegalDocumentAdmin(id);
    await load();
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper sap-page legal-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Gestão de Termos (LGPD)</b>
            <span>Gerencie os termos de uso e política de privacidade</span>
          </div>
          <div className="sap-top-actions">
            <div className="sap-select legal-select">
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value as any)}>
                <option value="all">Todos os tipos</option>
                <option value="terms">Termos de Uso</option>
                <option value="privacy">Política de Privacidade</option>
              </select>
            </div>
            <button className="sap-primary" type="button" onClick={openCreate}>+ Nova Versão</button>
            <a href="/admin/communications">Voltar</a>
          </div>
        </div>

        <div className="sap-card legal-table-card">
          <div className="sap-card-header">
            <b>Termos e Privacidade</b>
            {publishedRow && (
              <span className="legal-current">
                Versão ativa: v{publishedRow.version} ({publishedRow.title})
              </span>
            )}
          </div>
          {error && <div className="sap-empty"><span>{error}</span></div>}
          {loading ? (
            <div className="sap-empty"><b>Carregando...</b><span>Buscando versões</span></div>
          ) : filteredRows.length ? (
            <table className="sap-table legal-table">
              <thead>
                <tr>
                  <th>Versão</th>
                  <th>Tipo</th>
                  <th>Data de publicação</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>v{row.version}.0</td>
                    <td>
                      <span className="legal-pill">{typeLabel(row.documentType)}</span>
                    </td>
                    <td>{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("pt-BR") : "—"}</td>
                    <td>
                      <span className={`legal-status ${row.isPublished ? "active" : "archived"}`}>
                        {row.isPublished ? "Ativo" : "Arquivado"}
                      </span>
                    </td>
                    <td className="sap-actions">
                      <button className="sap-actions-trigger legal-eye" onClick={() => openEdit(row, "view")} aria-label="Visualizar">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M2 12C4.8 7.6 8.1 5.3 12 5.3C15.9 5.3 19.2 7.6 22 12C19.2 16.4 15.9 18.7 12 18.7C8.1 18.7 4.8 16.4 2 12Z" stroke="currentColor" strokeWidth="1.8"/>
                          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8"/>
                        </svg>
                      </button>
                      <button className="sap-actions-trigger" onClick={() => openEdit(row, "edit")}>Editar</button>
                      {!row.isPublished && (
                        <button className="sap-actions-trigger" onClick={() => handlePublish(row.id)}>Publicar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="sap-empty"><b>Nada por aqui</b><span>Nenhuma versão cadastrada</span></div>
          )}
        </div>

        {openModal && (
          <div className="modal-overlay legal-modal-overlay">
            <div className="modal-card legal-modal-card">
              <div className="modal-header">
                <b>
                  {modalMode === "create"
                    ? "Nova Versão do Documento"
                    : modalMode === "view"
                      ? "Visualização do Documento"
                      : "Editar Documento"}
                </b>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="sap-form">
                <div className="sap-field">
                  <label>Tipo de Documento</label>
                  <select
                    value={formType}
                    disabled={modalMode !== "create"}
                    onChange={(event) => setFormType(event.target.value as LegalDocumentType)}
                  >
                    <option value="terms">Termos de Uso</option>
                    <option value="privacy">Política de Privacidade</option>
                  </select>
                </div>
                <div className="sap-field">
                  <label>Título</label>
                  <input
                    value={title}
                    disabled={modalMode === "view"}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div className="sap-field">
                  <label>Conteúdo do Documento</label>
                  <div className="sap-rich-editor legal-rich-editor">
                    <RichTextToolbar editor={editor} disabled={modalMode === "view"} />
                    <EditorContent editor={editor} />
                  </div>
                </div>
                {modalMode !== "view" && (
                  <>
                    <div className="legal-toggle">
                      <div>
                        <b>Definir como versão ativa</b>
                        <span>Esta versão substituirá a versão atual</span>
                      </div>
                      <input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} />
                    </div>
                    <div className="legal-toggle">
                      <div>
                        <b>Resetar aceite de todos os usuários no próximo login</b>
                        <span>Ativo ao publicar nova versão</span>
                      </div>
                      <input type="checkbox" checked={resetAcceptance} onChange={(event) => setResetAcceptance(event.target.checked)} />
                    </div>
                    <div className="sap-form-actions legal-modal-actions">
                      <button className="sap-secondary" type="button" onClick={closeModal}>Cancelar</button>
                      <button
                        className="sap-primary"
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !title.trim() || !stripHtml(content)}
                      >
                        {saving ? "Salvando..." : publishNow ? "Publicar" : "Salvar"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLegalDocumentsPage;
