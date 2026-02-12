import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Menubar from "../components/admin/menubar";
import { listNotificationTemplates } from "../controllers/notificationTemplates/listNotificationTemplates.controller";
import { getNotificationTemplateById } from "../controllers/notificationTemplates/getNotificationTemplateById.controller";
import { createNotificationTemplate } from "../controllers/notificationTemplates/createNotificationTemplate.controller";
import { createNotificationTemplateVersion } from "../controllers/notificationTemplates/createNotificationTemplateVersion.controller";
import { activateNotificationTemplate } from "../controllers/notificationTemplates/activateNotificationTemplate.controller";
import { archiveNotificationTemplate } from "../controllers/notificationTemplates/archiveNotificationTemplate.controller";
import { previewNotificationTemplate } from "../controllers/notificationTemplates/previewNotificationTemplate.controller";

import "../style/adminCommunicationTemplatesPage.css";
import "../style/adminCommunication.css";

type TTemplate = {
  id: number | string;
  slug?: string;
  name?: string;
  channel?: string;
  category?: string;
  language?: string;
  status?: string;
  version?: number;
  subject?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
};

type TModal = "create" | "detail" | "version" | "preview" | null;

function labelStatus(status?: string) {
  const value = String(status ?? "").toLowerCase();
  if (value === "active") return "Ativo";
  if (value === "archived") return "Arquivado";
  if (value === "draft") return "Rascunho";
  return status || "—";
}

const TEMPLATE_PLACEHOLDERS = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "role",
  "courseName",
  "lessonName",
  "date",
];

function extractPlaceholders(text?: string) {
  if (!text) return [];
  const matches = text.match(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g) ?? [];
  const keys = matches
    .map(item => item.replace(/{{\s*|\s*}}/g, ""))
    .filter(Boolean);
  return Array.from(new Set(keys));
}

function setNestedValue(target: Record<string, any>, path: string, value: string) {
  const chunks = path.split(".").filter(Boolean);
  if (!chunks.length) return target;
  let cursor: Record<string, any> = target;
  for (let index = 0; index < chunks.length; index += 1) {
    const key = chunks[index];
    const isLast = index === chunks.length - 1;
    if (isLast) {
      cursor[key] = value;
    } else {
      if (typeof cursor[key] !== "object" || cursor[key] === null || Array.isArray(cursor[key])) {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
  }
  return target;
}

function buildVariablesFromFields(fields: Record<string, string>) {
  const output: Record<string, any> = {};
  Object.entries(fields).forEach(([key, value]) => {
    setNestedValue(output, key, value);
  });
  return output;
}

function getPreviewFields(template?: TTemplate | null) {
  const keys = [
    ...extractPlaceholders(template?.subject),
    ...extractPlaceholders(template?.body),
  ];
  return Array.from(new Set(keys)).reduce<Record<string, string>>((accumulator, key) => {
    accumulator[key] = "";
    return accumulator;
  }, {});
}

function getNestedValue(source: Record<string, any>, path: string) {
  return path.split(".").reduce<any>((accumulator, key) => {
    if (accumulator && typeof accumulator === "object") return accumulator[key];
    return undefined;
  }, source);
}

function renderHtmlTemplate(template: string | undefined, variables: Record<string, any>) {
  if (!template) return "";
  return template.replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, rawKey) => {
    const key = String(rawKey || "").trim();
    const value = getNestedValue(variables, key);
    return value === undefined || value === null ? "" : String(value);
  });
}

function getRenderedPreviewHtml(
  previewResponse: any,
  templateBody: string | undefined,
  variables: Record<string, any>
) {
  const fromApi = previewResponse?.html
    ?? previewResponse?.body
    ?? previewResponse?.renderedBody
    ?? previewResponse?.messageHtml
    ?? previewResponse?.content;
  if (typeof fromApi === "string" && fromApi.trim()) return fromApi;
  return renderHtmlTemplate(templateBody, variables);
}

function RichTextToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div className="sap-editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
      >
        B
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
      >
        I
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline?.().run()}
      >
        U
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active" : ""}
      >
        • Lista
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active" : ""}
      >
        1. Lista
      </button>

      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        Remover link
      </button>

      <select
        defaultValue=""
        onChange={event => {
          const variableName = event.target.value;
          if (!variableName) return;
          editor.chain().focus().insertContent(`{{${variableName}}}`).run();
          event.target.value = "";
        }}
      >
        <option value="">Inserir variável</option>
        {TEMPLATE_PLACEHOLDERS.map(placeholder => (
          <option key={placeholder} value={placeholder}>
            {`{{${placeholder}}}`}
          </option>
        ))}
      </select>
    </div>
  );
}

function AdminCommunicationTemplatesPage() {
  const [rows, setRows] = useState<TTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");
  const [category, setCategory] = useState("all");
  const [language, setLanguage] = useState("all");

  const [modal, setModal] = useState<TModal>(null);
  const [selected, setSelected] = useState<TTemplate | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    channel: "email",
    language: "pt-BR",
    category: "",
    subject: "",
    body: "",
  });

  const [versionForm, setVersionForm] = useState({
    name: "",
    category: "",
    subject: "",
    body: "",
  });

  const [previewFields, setPreviewFields] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const createEditor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: createForm.body,
    onUpdate({ editor }) {
      setCreateForm(prev => ({ ...prev, body: editor.getHTML() }));
    },
  });

  const versionEditor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: versionForm.body,
    onUpdate({ editor }) {
      setVersionForm(prev => ({ ...prev, body: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!createEditor) return;
    const current = createEditor.getHTML();
    if (current !== createForm.body) {
      createEditor.commands.setContent(createForm.body || "<p></p>", { emitUpdate: false });
    }
  }, [createEditor, createForm.body]);

  useEffect(() => {
    if (!versionEditor) return;
    const current = versionEditor.getHTML();
    if (current !== versionForm.body) {
      versionEditor.commands.setContent(versionForm.body || "<p></p>", { emitUpdate: false });
    }
  }, [versionEditor, versionForm.body]);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const response = await listNotificationTemplates({
        q: q.trim() || undefined,
        status: status === "all" ? undefined : status,
        channel: channel === "all" ? undefined : channel,
        category: category === "all" ? undefined : category,
        language: language === "all" ? undefined : language,
      });

      const list: TTemplate[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.items)
          ? (response as any).items
          : Array.isArray((response as any)?.data)
            ? (response as any).data
            : [];
      setRows(list);
    } catch (e) {
      console.error("Erro ao listar templates", e);
      setRows([]);
      setError("Não foi possível carregar os templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadTemplates, 250);
    return () => clearTimeout(timer);
  }, [q, status, channel, category, language]);

  const channelOptions = useMemo(() => {
    const values = rows.map(item => String(item.channel ?? "").trim()).filter(Boolean);
    return Array.from(new Set(values));
  }, [rows]);

  const categoryOptions = useMemo(() => {
    const values = rows.map(item => String(item.category ?? "").trim()).filter(Boolean);
    return Array.from(new Set(values));
  }, [rows]);

  const languageOptions = useMemo(() => {
    const values = rows.map(item => String(item.language ?? "").trim()).filter(Boolean);
    return Array.from(new Set(values));
  }, [rows]);

  function closeModal() {
    setModal(null);
    setSelected(null);
    setPreviewFields({});
    setPreviewResult(null);
    setPreviewError(null);
    setModalLoading(false);
    setSaving(false);
  }

  async function openDetail(template: TTemplate) {
    setModal("detail");
    setModalLoading(true);
    setSelected(null);
    try {
      const detail = await getNotificationTemplateById(template.id);
      setSelected((detail as TTemplate) ?? template);
    } catch (e) {
      console.error("Erro ao buscar detalhes do template", e);
      setSelected(template);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleCreate() {
    setSaving(true);
    try {
      await createNotificationTemplate({
        name: createForm.name.trim(),
        channel: createForm.channel.trim(),
        language: createForm.language.trim(),
        category: createForm.category.trim() || undefined,
        subject: createForm.subject.trim() || undefined,
        body: createForm.body,
      });
      closeModal();
      await loadTemplates();
    } catch (e) {
      console.error("Erro ao criar template", e);
      setError("Não foi possível criar o template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateVersion() {
    if (!selected) return;
    setSaving(true);
    try {
      await createNotificationTemplateVersion(selected.id, {
        name: versionForm.name.trim() || undefined,
        category: versionForm.category.trim() || undefined,
        subject: versionForm.subject.trim() || undefined,
        body: versionForm.body.trim() || undefined,
      });
      closeModal();
      await loadTemplates();
    } catch (e) {
      console.error("Erro ao criar nova versão", e);
      setError("Não foi possível criar uma nova versão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(templateId: number | string) {
    await activateNotificationTemplate(templateId);
    await loadTemplates();
  }

  async function handleArchive(templateId: number | string) {
    await archiveNotificationTemplate(templateId);
    await loadTemplates();
  }

  async function handlePreview() {
    if (!selected) return;
    setSaving(true);
    setPreviewError(null);
    setPreviewResult(null);
    try {
      const data = await previewNotificationTemplate(selected.id, {
        variables: buildVariablesFromFields(previewFields),
      });
      setPreviewResult(data);
    } catch (e) {
      console.error("Erro no preview", e);
      setPreviewError("Não foi possível renderizar o preview.");
    } finally {
      setSaving(false);
    }
  }

  async function openPreview(template: TTemplate) {
    setModal("preview");
    setModalLoading(true);
    setPreviewResult(null);
    setPreviewError(null);
    try {
      const detail = await getNotificationTemplateById(template.id);
      const normalizedTemplate = (detail as TTemplate) ?? template;
      setSelected(normalizedTemplate);
      setPreviewFields(getPreviewFields(normalizedTemplate));
    } catch (e) {
      console.error("Erro ao buscar template para preview", e);
      setSelected(template);
      setPreviewFields(getPreviewFields(template));
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper sap-page admin-templates-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Templates de Comunicação</b>
            <span>Gerencie versões e status de templates por canal/idioma</span>
          </div>
          <div className="atp-top-actions">
            <a href="/admin/communications">Voltar para Comunicações</a>
            <button
              className="sap-primary"
              type="button"
              onClick={() => {
                setCreateForm({
                  name: "",
                  channel: "email",
                  language: "pt-BR",
                  category: "",
                  subject: "",
                  body: "",
                });
                setModal("create");
              }}
            >
              + Novo Template
            </button>
          </div>
        </div>

        <div className="atp-filters">
          <div className="sap-input sap-input-wide">
            <input placeholder="Buscar por slug, nome..." value={q} onChange={event => setQ(event.target.value)} />
          </div>
          <div className="sap-select">
            <select value={status} onChange={event => setStatus(event.target.value)}>
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="draft">Rascunhos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
          <div className="sap-select">
            <select value={channel} onChange={event => setChannel(event.target.value)}>
              <option value="all">Todos os canais</option>
              {channelOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="sap-select">
            <select value={category} onChange={event => setCategory(event.target.value)}>
              <option value="all">Todas as categorias</option>
              {categoryOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="sap-select">
            <select value={language} onChange={event => setLanguage(event.target.value)}>
              <option value="all">Todos os idiomas</option>
              {languageOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-header">
            <b>Lista de Templates</b>
          </div>

          {loading ? (
            <div className="sap-empty"><b>Carregando...</b><span>Buscando templates</span></div>
          ) : error ? (
            <div className="sap-empty"><b>Erro</b><span>{error}</span></div>
          ) : rows.length ? (
            <table className="sap-table atp-table">
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Nome</th>
                  <th>Canal</th>
                  <th>Idioma</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Versão</th>
                  <th>Atualizado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(template => (
                  <tr key={String(template.id)}>
                    <td><b>{template.slug ?? "—"}</b></td>
                    <td>{template.name ?? "—"}</td>
                    <td>{template.channel ?? "—"}</td>
                    <td>{template.language ?? "—"}</td>
                    <td>{template.category ?? "—"}</td>
                    <td><span className={`atp-status ${String(template.status ?? "").toLowerCase()}`}>{labelStatus(template.status)}</span></td>
                    <td>{template.version ?? "—"}</td>
                    <td>{template.updatedAt ? new Date(template.updatedAt).toLocaleString("pt-BR") : "—"}</td>
                    <td className="atp-actions">
                      <button type="button" onClick={() => openDetail(template)}>Ver</button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(template);
                          setVersionForm({
                            name: template.name ?? "",
                            category: template.category ?? "",
                            subject: template.subject ?? "",
                            body: template.body ?? "",
                          });
                          setModal("version");
                        }}
                      >
                        Nova versão
                      </button>
                      <button type="button" onClick={() => openPreview(template)}>Preview</button>
                      <button type="button" onClick={() => handleActivate(template.id)}>Ativar</button>
                      <button type="button" className="danger" onClick={() => handleArchive(template.id)}>Arquivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="sap-empty"><b>Nada por aqui</b><span>Nenhum template encontrado.</span></div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card atp-modal-card" onClick={event => event.stopPropagation()}>
            <div className="modal-header atp-modal-header">
              <b>
                {modal === "create" && "Novo template"}
                {modal === "detail" && "Detalhes do template"}
                {modal === "version" && "Criar nova versão"}
                {modal === "preview" && "Preview de placeholders"}
              </b>
              <button type="button" className="modal-close" onClick={closeModal}>×</button>
            </div>

            {modal === "create" && (
              <div className="sap-form">
                <div className="atp-grid">
                  <div className="sap-field">
                    <label>Nome</label>
                    <input placeholder="Nome interno" value={createForm.name} onChange={event => setCreateForm(prev => ({ ...prev, name: event.target.value }))} />
                  </div>
                  <div className="sap-field">
                    <label>Canal</label>
                    <select value={createForm.channel} onChange={event => setCreateForm(prev => ({ ...prev, channel: event.target.value }))}>
                      <option value="email">email</option>
                      <option value="whatsapp">whatsapp</option>
                      <option value="in_app">in_app</option>
                    </select>
                  </div>
                  <div className="sap-field">
                    <label>Idioma</label>
                    <input placeholder="pt-BR" value={createForm.language} onChange={event => setCreateForm(prev => ({ ...prev, language: event.target.value }))} />
                  </div>
                  <div className="sap-field">
                    <label>Categoria</label>
                    <input placeholder="Categoria" value={createForm.category} onChange={event => setCreateForm(prev => ({ ...prev, category: event.target.value }))} />
                  </div>
                  <div className="sap-field">
                    <label>Assunto</label>
                    <input placeholder="Assunto do email (opcional)" value={createForm.subject} onChange={event => setCreateForm(prev => ({ ...prev, subject: event.target.value }))} />
                  </div>
                </div>
                <div className="sap-field">
                  <label>Body</label>
                  <div className="sap-rich-editor">
                    <RichTextToolbar editor={createEditor} />
                    <EditorContent editor={createEditor} />
                  </div>
                </div>
                <div className="sap-form-actions">
                  <button className="sap-primary" type="button" disabled={!createForm.name.trim() || !createForm.body || saving} onClick={handleCreate}>
                    {saving ? "Salvando..." : "Criar template"}
                  </button>
                </div>
              </div>
            )}

            {modal === "detail" && (
              <div className="atp-detail">
                {modalLoading ? (
                  <span>Carregando...</span>
                ) : selected ? (
                  <>
                    <div><b>ID:</b> {selected.id}</div>
                    <div><b>Slug:</b> {selected.slug ?? "—"}</div>
                    <div><b>Nome:</b> {selected.name ?? "—"}</div>
                    <div><b>Canal:</b> {selected.channel ?? "—"}</div>
                    <div><b>Idioma:</b> {selected.language ?? "—"}</div>
                    <div><b>Categoria:</b> {selected.category ?? "—"}</div>
                    <div><b>Status:</b> {labelStatus(selected.status)}</div>
                    <div><b>Versão:</b> {selected.version ?? "—"}</div>
                    <div><b>Assunto:</b> {selected.subject ?? "—"}</div>
                    <pre>{selected.body ?? "—"}</pre>
                  </>
                ) : (
                  <span>Template não encontrado.</span>
                )}
              </div>
            )}

            {modal === "version" && (
              <div className="sap-form">
                <div className="atp-grid">
                  <div className="sap-field">
                    <label>Nome</label>
                    <input placeholder="Nome interno" value={versionForm.name} onChange={event => setVersionForm(prev => ({ ...prev, name: event.target.value }))} />
                  </div>
                  <div className="sap-field">
                    <label>Categoria</label>
                    <input placeholder="Categoria" value={versionForm.category} onChange={event => setVersionForm(prev => ({ ...prev, category: event.target.value }))} />
                  </div>
                  <div className="sap-field">
                    <label>Assunto</label>
                    <input placeholder="Assunto (opcional)" value={versionForm.subject} onChange={event => setVersionForm(prev => ({ ...prev, subject: event.target.value }))} />
                  </div>
                </div>
                <div className="sap-field">
                  <label>Body</label>
                  <div className="sap-rich-editor">
                    <RichTextToolbar editor={versionEditor} />
                    <EditorContent editor={versionEditor} />
                  </div>
                </div>
                <div className="sap-form-actions">
                  <button className="sap-primary" type="button" disabled={saving} onClick={handleCreateVersion}>
                    {saving ? "Salvando..." : "Criar nova versão"}
                  </button>
                </div>
              </div>
            )}

            {modal === "preview" && (
              <div className="sap-form">
                {modalLoading ? (
                  <div className="atp-detail"><span>Carregando placeholders...</span></div>
                ) : Object.keys(previewFields).length ? (
                  <>
                    <div className="atp-preview-grid">
                      {Object.keys(previewFields).map(key => (
                        <div className="sap-field" key={key}>
                          <label>{`{{${key}}}`}</label>
                          <input
                            placeholder={`Valor para ${key}`}
                            value={previewFields[key] ?? ""}
                            onChange={event => setPreviewFields(prev => ({ ...prev, [key]: event.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="sap-field">
                      <label>Mensagem (HTML)</label>
                      <div
                        className="atp-preview-html"
                        dangerouslySetInnerHTML={{
                          __html: getRenderedPreviewHtml(
                            previewResult,
                            selected?.body,
                            buildVariablesFromFields(previewFields)
                          ) || "<p>Sem conteúdo para preview.</p>",
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="atp-detail"><span>Nenhum placeholder encontrado neste template.</span></div>
                )}
                <div className="sap-form-actions">
                  <button className="sap-primary" type="button" disabled={saving || modalLoading || !selected} onClick={handlePreview}>
                    {saving ? "Renderizando..." : "Renderizar preview"}
                  </button>
                </div>
                {previewError && <span className="atp-error">{previewError}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCommunicationTemplatesPage;
