import React, { useEffect, useMemo, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Menubar from "../components/admin/menubar"
import { listRetentionTriggers } from "../controllers/retentionTriggers/listRetentionTriggers.controller"
import { createRetentionTrigger } from "../controllers/retentionTriggers/createRetentionTrigger.controller"
import { updateRetentionTrigger } from "../controllers/retentionTriggers/updateRetentionTrigger.controller"
import { toggleRetentionTrigger } from "../controllers/retentionTriggers/toggleRetentionTrigger.controller"
import { runRetentionTriggers } from "../controllers/retentionTriggers/runRetentionTriggers.controller"
import "../style/adminCommunication.css"
import "../style/adminRetentionTriggersPage.css"

type Trigger = {
  id: number
  name: string
  inactivityDays: number
  targetRole: "educator" | "consultant"
  title: string
  message: string
  link?: string | null
  channels?: Array<"in_app" | "email"> | null
  isActive: boolean
  sentCount?: number
  failedCount?: number
  updatedAt?: string
}

const TIMELINE_DAYS = [7, 15, 30]
const RETENTION_VARIABLES = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "role",
  "inactiveDays",
  "retentionDays",
  "date"
]

function stripHtml(value: string) {
  if (!value) return ""
  const doc = new DOMParser().parseFromString(value, "text/html")
  return (doc.body.textContent || "").trim()
}

function roleLabel(role?: string) {
  if (role === "educator") return "Educador"
  if (role === "consultant") return "Consultor"
  return role || "—"
}

function channelsLabel(channels?: Array<"in_app" | "email"> | null) {
  const safe = Array.isArray(channels) ? channels : []
  if (!safe.length) return "In-app"
  return safe.map((channel) => (channel === "in_app" ? "In-app" : "E-mail")).join(", ")
}

function RichTextToolbar({ editor }: { editor: any }) {
  if (!editor) return null

  return (
    <div className="sap-editor-toolbar">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}>B</button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}>I</button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline?.().run()}>U</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "active" : ""}>• Lista</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "active" : ""}>1. Lista</button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("Link:")
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
      >
        Link
      </button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()}>Remover link</button>
    </div>
  )
}

function AdminRetentionTriggersPage() {
  const [rows, setRows] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roleFilter, setRoleFilter] = useState<"all" | "educator" | "consultant">("all")
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<Trigger | null>(null)

  const [form, setForm] = useState({
    name: "",
    inactivityDays: 7,
    targetRole: "educator" as "educator" | "consultant",
    title: "",
    message: "",
    link: "",
    channels: ["in_app"] as Array<"in_app" | "email">
  })
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false })
    ],
    content: form.message,
    onUpdate({ editor }) {
      setForm((prev) => ({ ...prev, message: editor.getHTML() }))
    }
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== form.message) {
      editor.commands.setContent(form.message || "<p></p>", { emitUpdate: false })
    }
  }, [editor, form.message])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listRetentionTriggers()
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setRows([])
      setError("Não foi possível carregar os gatilhos de retenção.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredRows = useMemo(() => {
    if (roleFilter === "all") return rows
    return rows.filter((row) => row.targetRole === roleFilter)
  }, [rows, roleFilter])

  const timelineRows = useMemo(() => {
    return TIMELINE_DAYS.map((days) => {
      const row = rows.find((item) => item.inactivityDays === days && item.targetRole === (roleFilter === "all" ? "educator" : roleFilter))
      return { days, row }
    })
  }, [rows, roleFilter])

  function openCreateModal() {
    setEditing(null)
    setForm({
      name: "",
      inactivityDays: 7,
      targetRole: roleFilter === "all" ? "educator" : roleFilter,
      title: "",
      message: "",
      link: "",
      channels: ["in_app"]
    })
    setOpenModal(true)
  }

  function openEditModal(row: Trigger) {
    setEditing(row)
    setForm({
      name: row.name,
      inactivityDays: row.inactivityDays,
      targetRole: row.targetRole,
      title: row.title,
      message: row.message,
      link: row.link || "",
      channels: Array.isArray(row.channels) && row.channels.length ? row.channels : ["in_app"]
    })
    setOpenModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.title.trim() || !stripHtml(form.message) || !form.channels.length) return
    setSaving(true)
    try {
      if (editing?.id) {
        await updateRetentionTrigger(editing.id, {
          name: form.name.trim(),
          inactivityDays: form.inactivityDays,
          targetRole: form.targetRole,
          title: form.title.trim(),
          message: form.message,
          link: form.link.trim() || null,
          channels: form.channels
        })
      } else {
        await createRetentionTrigger({
          name: form.name.trim(),
          inactivityDays: form.inactivityDays,
          targetRole: form.targetRole,
          title: form.title.trim(),
          message: form.message,
          link: form.link.trim() || undefined,
          channels: form.channels
        })
      }
      setOpenModal(false)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(row: Trigger) {
    await toggleRetentionTrigger(row.id, !row.isActive)
    await load()
  }

  async function handleRun(triggerId?: number) {
    setRunning(true)
    try {
      await runRetentionTriggers(triggerId)
      await load()
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="admin-dashboard-container">
      <Menubar />
      <div className="admin-dashboard-wrapper sap-page retention-page">
        <div className="admin-header-wrapper">
          <div>
            <b>Régua de Retenção</b>
            <span>Gatilhos temporais para usuários inativos (7, 15 e 30 dias)</span>
          </div>
          <div className="sap-top-actions">
            <a href="/admin/communications">Voltar para Comunicações</a>
            <button className="sap-primary" type="button" onClick={() => handleRun()} disabled={running}>
              {running ? "Executando..." : "Executar agora"}
            </button>
            <button className="sap-primary" type="button" onClick={openCreateModal}>
              + Novo gatilho
            </button>
          </div>
        </div>

        <div className="retention-timeline">
          {timelineRows.map(({ days, row }) => (
            <div key={days} className={`retention-card ${row?.isActive ? "active" : "inactive"}`}>
              <span className="retention-day">{days} dias</span>
              <b>{row?.name || "Sem gatilho"}</b>
              <small>{row ? roleLabel(row.targetRole) : "Configure um gatilho"}</small>
            </div>
          ))}
        </div>

        <div className="sap-filters">
          <div className="sap-select">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as any)}>
              <option value="all">Todos os perfis</option>
              <option value="educator">Educador</option>
              <option value="consultant">Consultor</option>
            </select>
          </div>
        </div>

        <div className="sap-card">
          <div className="sap-card-header">
            <b>Gatilhos configurados</b>
          </div>
          {error && <div className="sap-empty"><span>{error}</span></div>}
          {loading ? (
            <div className="sap-empty"><b>Carregando...</b><span>Buscando gatilhos</span></div>
          ) : filteredRows.length ? (
            <table className="sap-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Dias</th>
                  <th>Perfil</th>
                  <th>Canais</th>
                  <th>Status</th>
                  <th>Disparos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><b>{row.name}</b></td>
                    <td>{row.inactivityDays}</td>
                    <td>{roleLabel(row.targetRole)}</td>
                    <td>{channelsLabel(row.channels)}</td>
                    <td>
                      <button
                        type="button"
                        className={`retention-toggle ${row.isActive ? "on" : "off"}`}
                        onClick={() => handleToggle(row)}
                      >
                        {row.isActive ? "On" : "Off"}
                      </button>
                    </td>
                    <td>{row.sentCount ?? 0} enviados / {row.failedCount ?? 0} falhas</td>
                    <td className="sap-actions">
                      <button className="sap-actions-trigger" onClick={() => openEditModal(row)}>Editar</button>
                      <button className="sap-actions-trigger" onClick={() => handleRun(row.id)} disabled={running}>Rodar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="sap-empty"><b>Nada por aqui</b><span>Nenhum gatilho encontrado</span></div>
          )}
        </div>

        {openModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <b>{editing ? "Editar gatilho" : "Novo gatilho"}</b>
                <button className="modal-close" onClick={() => setOpenModal(false)}>×</button>
              </div>
              <div className="sap-form">
                <div className="sap-field">
                  <label>Nome</label>
                  <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                </div>
                <div className="sap-field">
                  <label>Dias de inatividade</label>
                  <select
                    value={form.inactivityDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, inactivityDays: Number(event.target.value) }))}
                  >
                    {TIMELINE_DAYS.map((day) => <option key={day} value={day}>{day} dias</option>)}
                  </select>
                </div>
                <div className="sap-field">
                  <label>Perfil alvo</label>
                  <select
                    value={form.targetRole}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetRole: event.target.value as "educator" | "consultant" }))}
                  >
                    <option value="educator">Educador</option>
                    <option value="consultant">Consultor</option>
                  </select>
                </div>
                <div className="sap-field">
                  <label>Título</label>
                  <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                </div>
                <div className="sap-field">
                  <label>Mensagem</label>
                  <div className="sap-rich-editor">
                    <RichTextToolbar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>
                </div>
                <div className="sap-field">
                  <label>Variáveis disponíveis</label>
                  <div className="retention-variables">
                    {RETENTION_VARIABLES.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        className="retention-variable-chip"
                        onClick={() => editor?.chain().focus().insertContent(`{{${variable}}}`).run()}
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sap-field">
                  <label>Link (opcional)</label>
                  <input value={form.link} onChange={(event) => setForm((prev) => ({ ...prev, link: event.target.value }))} />
                </div>
                <div className="sap-field">
                  <label>Canais</label>
                  <div className="sap-channel-selector">
                    <label className="sap-channel-option">
                      <input
                        type="checkbox"
                        checked={form.channels.includes("in_app")}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          channels: event.target.checked
                            ? (prev.channels.includes("in_app") ? prev.channels : [...prev.channels, "in_app"])
                            : prev.channels.filter((channel) => channel !== "in_app") as Array<"in_app" | "email">
                        }))}
                      />
                      In-app
                    </label>
                    <label className="sap-channel-option">
                      <input
                        type="checkbox"
                        checked={form.channels.includes("email")}
                        onChange={(event) => setForm((prev) => ({
                          ...prev,
                          channels: event.target.checked
                            ? (prev.channels.includes("email") ? prev.channels : [...prev.channels, "email"])
                            : prev.channels.filter((channel) => channel !== "email") as Array<"in_app" | "email">
                        }))}
                      />
                      E-mail
                    </label>
                  </div>
                </div>

                <div className="sap-form-actions">
                  <button
                    className="sap-primary"
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !form.name.trim() || !form.title.trim() || !stripHtml(form.message) || !form.channels.length}
                  >
                    {saving ? "Salvando..." : "Salvar gatilho"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminRetentionTriggersPage
