import React, { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Menubar from "../components/admin/menubar";
import { createEducatorFeedPost } from "../controllers/feed/createEducatorFeedPost.controller";
import { deleteEducatorFeedPost } from "../controllers/feed/deleteEducatorFeedPost.controller";
import { listAdminEducatorFeedPosts } from "../controllers/feed/listAdminEducatorFeedPosts.controller";
import { uploadEducatorFeedImage } from "../controllers/feed/uploadEducatorFeedImage.controller";
import { updateEducatorFeedPost } from "../controllers/feed/updateEducatorFeedPost.controller";

import "../style/adminEducatorFeedPage.css";
import "../style/adminCommunication.css";

type TFeedPost = {
  id: number;
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  updatedAt?: string;
};

type TFormState = {
  id: number | null;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  displayOrder: number;
  isActive: boolean;
};

const emptyForm = (): TFormState => ({
  id: null,
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  linkLabel: "",
  displayOrder: 0,
  isActive: true
});

function RichTextToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  function keepEditorSelection(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return (
    <div className="sap-editor-toolbar">
      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "active" : ""}
      >
        B
      </button>

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "active" : ""}
      >
        I
      </button>

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "active" : ""}
      >
        • Lista
      </button>

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "active" : ""}
      >
        1. Lista
      </button>

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => {
          const url = window.prompt("Link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        Link
      </button>

      <button
        type="button"
        onMouseDown={keepEditorSelection}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        Remover link
      </button>
    </div>
  );
}

function AdminEducatorFeedPage() {
  const [rows, setRows] = useState<TFeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<TFormState>(emptyForm());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: form.body,
    onUpdate({ editor: currentEditor }) {
      setForm(prev => ({ ...prev, body: currentEditor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextContent = form.body || "";
    if (editor.getHTML() !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, form.body]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await listAdminEducatorFeedPosts();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível carregar as publicações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeCount = useMemo(
    () => rows.filter(item => item.isActive).length,
    [rows]
  );

  function startCreate() {
    setFeedback(null);
    setForm(emptyForm());
    setImageFile(null);
    setIsModalOpen(true);
  }

  function startEdit(post: TFeedPost) {
    setFeedback(null);
    setForm({
      id: post.id,
      title: post.title || "",
      body: post.body || "",
      imageUrl: post.imageUrl || "",
      linkUrl: post.linkUrl || "",
      linkLabel: post.linkLabel || "",
      displayOrder: Number(post.displayOrder || 0),
      isActive: Boolean(post.isActive)
    });
    setImageFile(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
    setForm(emptyForm());
    setImageFile(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setFeedback(null);

    try {
      let imageUrl = form.imageUrl || undefined;

      if (imageFile) {
        const uploadedImage = await uploadEducatorFeedImage(imageFile);
        imageUrl = uploadedImage.url;
      }

      const payload = {
        title: form.title,
        body: form.body,
        imageUrl,
        linkUrl: form.linkUrl || undefined,
        linkLabel: form.linkLabel || undefined,
        displayOrder: Number(form.displayOrder || 0),
        isActive: form.isActive
      };

      if (form.id) {
        await updateEducatorFeedPost(form.id, payload);
        setFeedback("Publicação atualizada com sucesso.");
      } else {
        await createEducatorFeedPost(payload);
        setFeedback("Publicação criada com sucesso.");
      }

      setForm(emptyForm());
      setIsModalOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível salvar a publicação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Deseja remover esta publicação do feed?");
    if (!confirmed) return;

    setError(null);
    setFeedback(null);

    try {
      await deleteEducatorFeedPost(id);
      setFeedback("Publicação removida com sucesso.");
      if (form.id === id) closeModal();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Não foi possível remover a publicação.");
    }
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper sap-page educator-feed-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Feed do Educador</b>
            <span>Configure as publicações exibidas na dashboard do educador.</span>
          </div>
          <div className="sap-top-actions">
            <button type="button" className="sap-primary" onClick={startCreate}>
              + Nova publicação
            </button>
          </div>
        </div>

        <div className="sap-summary-grid">
          <div className="sap-summary-card">
            <div className="sap-summary-content">
              <b>{rows.length}</b>
              <span>Total de publicações</span>
            </div>
          </div>
          <div className="sap-summary-card">
            <div className="sap-summary-content">
              <b>{activeCount}</b>
              <span>Publicações ativas</span>
            </div>
          </div>
        </div>

        {error ? <div className="feed-admin-alert error">{error}</div> : null}
        {feedback ? <div className="feed-admin-alert success">{feedback}</div> : null}

        <div className="sap-card">
          <div className="sap-card-header">
            <b>Publicações cadastradas</b>
          </div>

          {loading ? (
            <div className="sap-empty">
              <b>Carregando...</b>
              <span>Buscando publicações do feed</span>
            </div>
          ) : rows.length ? (
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Ordem</th>
                  <th>Atualização</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(post => (
                  <tr key={post.id}>
                    <td>
                      <div className="sap-msg-cell">
                        <b>{post.title}</b>
                        <span>{String(post.body || "").replace(/<[^>]+>/g, " ")}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`sap-status ${post.isActive ? "sent" : "draft"}`}>
                        {post.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td>{post.displayOrder ?? 0}</td>
                    <td className="sap-date">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleString("pt-BR") : "-"}
                    </td>
                    <td className="feed-admin-actions-cell">
                      <button type="button" className="feed-admin-secondary" onClick={() => startEdit(post)}>
                        Editar
                      </button>
                      <button type="button" className="feed-admin-danger" onClick={() => handleDelete(post.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="sap-empty">
              <b>Nenhuma publicação cadastrada</b>
              <span>Crie a primeira publicação para exibir conteúdo no feed do educador.</span>
            </div>
          )}
        </div>

        {isModalOpen ? (
          <div className="feed-admin-modal-overlay" onClick={closeModal}>
            <div className="feed-admin-modal-card" onClick={event => event.stopPropagation()}>
              <form className="feed-admin-form" onSubmit={handleSubmit}>
                <div className="feed-admin-form-header">
                  <b>{form.id ? "Editar publicação" : "Nova publicação"}</b>
                  <button type="button" className="feed-admin-secondary" onClick={closeModal}>
                    Fechar
                  </button>
                </div>

                <div className="feed-admin-grid">
                  <label>
                    <span>Título</span>
                    <input
                      type="text"
                      value={form.title}
                      onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                      placeholder="Ex.: Jornada emocional"
                      required
                    />
                  </label>

                  <label>
                    <span>Ordem de exibição</span>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={event => setForm(prev => ({ ...prev, displayOrder: Number(event.target.value) }))}
                    />
                  </label>

                  <div className="feed-admin-grid-full feed-admin-editor-field">
                    <span className="feed-admin-field-label">Conteúdo</span>
                    <div className="sap-rich-editor feed-admin-rich-editor">
                      <RichTextToolbar editor={editor} />
                      <EditorContent editor={editor} />
                    </div>
                  </div>

                  <label className="feed-admin-grid-full">
                    <span>Imagem da publicação</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => setImageFile(event.target.files?.[0] ?? null)}
                    />
                    {imageFile ? (
                      <small className="feed-admin-file-hint">Nova imagem selecionada: {imageFile.name}</small>
                    ) : form.imageUrl ? (
                      <small className="feed-admin-file-hint">Já existe uma imagem cadastrada para esta publicação.</small>
                    ) : (
                      <small className="feed-admin-file-hint">Envie uma imagem para armazenar no CDN.</small>
                    )}
                  </label>

                  <label>
                    <span>Link de destino</span>
                    <input
                      type="url"
                      value={form.linkUrl}
                      onChange={event => setForm(prev => ({ ...prev, linkUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </label>

                  <label>
                    <span>Texto do link</span>
                    <input
                      type="text"
                      value={form.linkLabel}
                      onChange={event => setForm(prev => ({ ...prev, linkLabel: event.target.value }))}
                      placeholder="Saiba mais"
                    />
                  </label>

                  <label className="feed-admin-switch">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={event => setForm(prev => ({ ...prev, isActive: event.target.checked }))}
                    />
                    <span>Publicação ativa</span>
                  </label>
                </div>

                <div className="feed-admin-form-actions">
                  <button type="submit" className="sap-primary" disabled={saving}>
                    {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Criar publicação"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminEducatorFeedPage;
