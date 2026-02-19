import React, { useCallback, useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { listColleges } from "../../controllers/college/listColleges.controller"
import { listCourses as listAdminCourses } from "../../controllers/course/admin/listCourses.controller"
import { createCommunication } from "../../controllers/communication/createCommunication.controller"
import { updateCommunication } from "../../controllers/communication/updateCommunication.controller"
import { listNotificationTemplates } from "../../controllers/notificationTemplates/listNotificationTemplates.controller"
import { getNotificationTemplateById } from "../../controllers/notificationTemplates/getNotificationTemplateById.controller"

type Props = {
  initialData?: {
    id?: number
    title: string
    message: string
    link?: string
    deliveryChannels?: Array<"in_app" | "email"> | null
    templateId?: number | null
    templateSlug?: string | null
    templateLanguage?: string | null
    templateVariables?: Record<string, unknown> | null
  }
  onSuccess: () => void
}

type TargetType = "ALL_STUDENTS" | "SCHOOL" | "COURSE"

type Template = {
  id: number
  name?: string
  slug?: string
  language?: string
  subject?: string
  body?: string
}

type CourseOption = {
  id: number
  title: string
  isActive?: boolean
}

const AUTO_FILLED_TEMPLATE_VARIABLES = new Set([
  "userId",
  "firstName",
  "lastName",
  "fullName",
  "email",
  "role",
  "language",
  "management",
  "courseName",
  "schoolName",
  "collegeName",
  "collegeId",
  "date",
  "user.id",
  "user.firstName",
  "user.lastName",
  "user.fullName",
  "user.email",
  "user.role",
  "user.language",
  "user.management",
  "user.collegeId",
  "college.id",
  "college.name"
])

function extractPlaceholders(text?: string) {
  if (!text) return []
  const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g
  const keys = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) keys.add(match[1])
  }
  return Array.from(keys)
}

function CommunicationForm({ initialData, onSuccess }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [message, setMessage] = useState(initialData?.message ?? "")
  const [link, setLink] = useState(initialData?.link ?? "")
  const [saving, setSaving] = useState(false)
  const [channels, setChannels] = useState<Array<"in_app" | "email">>(["in_app", "email"])

  const [contentMode, setContentMode] = useState<"manual" | "template">(
    initialData?.templateId || initialData?.templateSlug ? "template" : "manual"
  )
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [templateError, setTemplateError] = useState<string | null>(null)

  const [targetType, setTargetType] = useState<TargetType>("ALL_STUDENTS")
  const [collegeId, setCollegeId] = useState<number | "">("")
  const [courseId, setCourseId] = useState<number | "">("")

  const [colleges, setColleges] = useState<{ id: number; name: string }[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])

  useEffect(() => {
    listColleges().then(setColleges).catch(() => {})
    listAdminCourses()
      .then((data: any) => {
        const rows = Array.isArray(data) ? data : []
        const mapped: CourseOption[] = rows
          .map((row: any) => ({
            id: Number(row?.id),
            title: String(row?.title ?? ""),
            isActive: row?.isActive
          }))
          .filter((row: CourseOption) => Number.isFinite(row.id) && row.id > 0 && row.title)
        const activeOnly = mapped.filter((row) => row.isActive !== false)
        setCourses(activeOnly)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (contentMode !== "template") return
    setTemplatesLoading(true)
    setTemplateError(null)
    listNotificationTemplates({ channel: "in_app", status: "active" })
      .then((data: any) => {
        const rows: Template[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : []
        setTemplates(rows)
      })
      .catch(() => {
        setTemplateError("Não foi possível carregar os templates ativos.")
      })
      .finally(() => setTemplatesLoading(false))
  }, [contentMode])

  useEffect(() => {
    setTitle(initialData?.title ?? "")
    setMessage(initialData?.message ?? "")
    setLink(initialData?.link ?? "")
    const deliveryChannels = initialData?.deliveryChannels
    const incomingChannels = Array.isArray(deliveryChannels)
      ? deliveryChannels.filter((channel): channel is "in_app" | "email" => channel === "in_app" || channel === "email")
      : []
    setChannels(incomingChannels.length ? incomingChannels : ["in_app", "email"])
    const startsWithTemplate = Boolean(initialData?.templateId || initialData?.templateSlug)
    setContentMode(startsWithTemplate ? "template" : "manual")
    setSelectedTemplateId(
      typeof initialData?.templateId === "number" ? initialData.templateId : ""
    )
    const incomingVariables = initialData?.templateVariables
    if (incomingVariables && typeof incomingVariables === "object") {
      const next: Record<string, string> = {}
      Object.entries(incomingVariables).forEach(([key, value]) => {
        next[key] = value === null || value === undefined ? "" : String(value)
      })
      setTemplateVariables(next)
    } else {
      setTemplateVariables({})
    }
  }, [initialData])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false })
    ],
    content: message,
    onUpdate({ editor }) {
      setMessage(editor.getHTML())
    }
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== message) {
      editor.commands.setContent(message || "<p></p>", { emitUpdate: false })
    }
  }, [editor, message])

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateVariables({})
      return
    }
    const placeholders = [
      ...extractPlaceholders(selectedTemplate.subject),
      ...extractPlaceholders(selectedTemplate.body)
    ]
    const keys = Array.from(new Set(placeholders)).filter((key) => !AUTO_FILLED_TEMPLATE_VARIABLES.has(key))
    setTemplateVariables((previous) => {
      const next: Record<string, string> = {}
      keys.forEach((key) => {
        next[key] = previous[key] ?? ""
      })
      return next
    })
  }, [selectedTemplate])

  function RichTextToolbar({ editor }: { editor: any }) {
    if (!editor) return null

    return (
      <div className="sap-editor-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
        >B</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
        >I</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline?.().run()}
        >U</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
        >• Lista</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
        >1. Lista</button>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Link:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
        >Link</button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >Remover link</button>
      </div>
    )
  }

  const handleSelectTemplate = useCallback(async (id: number | "") => {
    setSelectedTemplateId(id)
    setTemplateError(null)
    if (!id) {
      setSelectedTemplate(null)
      setTitle("")
      setMessage("")
      return
    }

    try {
      const detail = await getNotificationTemplateById(id)
      const templateDetail = detail as Template
      setSelectedTemplate(templateDetail)
      setTitle(String(templateDetail?.subject ?? ""))
      setMessage(String(templateDetail?.body ?? ""))
    } catch {
      const fallback = templates.find((template) => template.id === id) ?? null
      setSelectedTemplate(fallback)
      setTitle(String(fallback?.subject ?? ""))
      setMessage(String(fallback?.body ?? ""))
      setTemplateError("Não foi possível carregar os detalhes do template selecionado.")
    }
  }, [templates])

  useEffect(() => {
    if (contentMode !== "template") return
    if (!selectedTemplateId || selectedTemplate) return
    handleSelectTemplate(selectedTemplateId)
  }, [contentMode, selectedTemplateId, selectedTemplate, handleSelectTemplate])

  async function handleSubmit() {
    if (contentMode === "manual" && (!title.trim() || !message.trim())) return
    if (contentMode === "template" && !selectedTemplateId) return
    setSaving(true)

    const targets: { type: "ALL_STUDENTS" | "SCHOOL" | "COURSE"; referenceId?: number }[] =
      targetType === "ALL_STUDENTS"
        ? [{ type: "ALL_STUDENTS" }]
        : targetType === "SCHOOL"
        ? (collegeId ? [{ type: "SCHOOL", referenceId: collegeId }] : [])
        : (courseId ? [{ type: "COURSE", referenceId: courseId }] : [])

    if (!initialData?.id && !targets.length) {
      setSaving(false)
      return
    }

    if (!channels.length) {
      setSaving(false)
      return
    }

    const normalizedTitle = title.trim() ? title : undefined
    const normalizedMessage = message.trim() ? message : undefined
    const normalizedLink = link.trim() ? link : undefined
    const normalizedVariables = Object.entries(templateVariables).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value.trim()) acc[key] = value
      return acc
    }, {})

    try {
      if (initialData?.id) {
        await updateCommunication(initialData.id, {
          title: normalizedTitle,
          message: normalizedMessage,
          link: normalizedLink,
          channels,
          templateId: contentMode === "template" ? Number(selectedTemplateId) : null,
          templateSlug: contentMode === "template" ? selectedTemplate?.slug : null,
          templateLanguage: contentMode === "template" ? selectedTemplate?.language : null,
          templateVariables: contentMode === "template" ? normalizedVariables : null
        })
      } else {
        await createCommunication({
          title: normalizedTitle,
          message: normalizedMessage,
          link: normalizedLink,
          channels,
          templateId: contentMode === "template" ? Number(selectedTemplateId) : undefined,
          templateSlug: contentMode === "template" ? selectedTemplate?.slug : undefined,
          templateLanguage: contentMode === "template" ? selectedTemplate?.language : undefined,
          templateVariables: contentMode === "template" ? normalizedVariables : undefined,
          targets
        })
      }
      onSuccess()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sap-form">
      <div className="sap-field">
        <label>Origem do conteúdo</label>
        <select
          value={contentMode}
          onChange={(event) => {
            const mode = event.target.value as "manual" | "template"
            setContentMode(mode)
            if (mode === "manual") {
              setSelectedTemplateId("")
              setSelectedTemplate(null)
              setTemplateVariables({})
              setTemplateError(null)
              return
            }
          }}
        >
          <option value="manual">Manual</option>
          <option value="template">Template ativo</option>
        </select>
      </div>

      {contentMode === "template" && (
        <>
          <div className="sap-field">
            <label>Template</label>
            <select
              value={selectedTemplateId}
              onChange={(event) => {
                const value = event.target.value ? Number(event.target.value) : ""
                handleSelectTemplate(value)
              }}
            >
              <option value="">Selecione um template ativo</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name || template.slug || `Template #${template.id}`}
                </option>
              ))}
            </select>
            {templatesLoading && <span>Carregando templates...</span>}
            {templateError && <span>{templateError}</span>}
          </div>

          {Object.keys(templateVariables).length > 0 && (
            <div className="sap-field">
              <label>Variáveis do template</label>
              <div className="atp-preview-grid">
                {Object.keys(templateVariables).map((key) => (
                  <div className="sap-field" key={key}>
                    <label>{`{{${key}}}`}</label>
                    <input
                      placeholder={`Valor para ${key}`}
                      value={templateVariables[key]}
                      onChange={(event) =>
                        setTemplateVariables((prev) => ({
                          ...prev,
                          [key]: event.target.value
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="sap-field">
        <label>
          Título
          {contentMode === "template" ? " (opcional, sobrescreve o template)" : ""}
        </label>
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="sap-field">
        <label>
          Mensagem
          {contentMode === "template" ? " (opcional, sobrescreve o template)" : ""}
        </label>
        <div className="sap-rich-editor">
          <RichTextToolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="sap-field">
        <label>Link (opcional)</label>
        <input value={link} onChange={e => setLink(e.target.value)} />
      </div>

      <div className="sap-field">
        <label>Canais de envio</label>
        <div className="sap-channel-selector">
          <label className="sap-channel-option">
            <input
              type="checkbox"
              checked={channels.includes("in_app")}
              onChange={(event) =>
                setChannels((previous) => {
                  if (event.target.checked) {
                    return previous.includes("in_app") ? previous : [...previous, "in_app"]
                  }
                  return previous.filter((channel) => channel !== "in_app") as Array<"in_app" | "email">
                })
              }
            />
            In-app
          </label>
          <label className="sap-channel-option">
            <input
              type="checkbox"
              checked={channels.includes("email")}
              onChange={(event) =>
                setChannels((previous) => {
                  if (event.target.checked) {
                    return previous.includes("email") ? previous : [...previous, "email"]
                  }
                  return previous.filter((channel) => channel !== "email") as Array<"in_app" | "email">
                })
              }
            />
            E-mail
          </label>
        </div>
        {!channels.length && <span>Selecione ao menos um canal.</span>}
      </div>

      <div className="sap-field">
        <label>Público</label>

        <select
          value={targetType}
          onChange={e => {
            setTargetType(e.target.value as TargetType)
            setCollegeId("")
            setCourseId("")
          }}
        >
          <option value="ALL_STUDENTS">Todos os educadores</option>
          <option value="SCHOOL">Por escola</option>
          <option value="COURSE">Por curso</option>
        </select>
      </div>

      {targetType === "SCHOOL" && (
        <div className="sap-field">
          <label>Escola</label>
          <select
            value={collegeId}
            onChange={e => setCollegeId(Number(e.target.value))}
          >
            <option value="">Selecione</option>
            {colleges.map(college => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {targetType === "COURSE" && (
        <div className="sap-field">
          <label>Curso</label>
          <select
            value={courseId}
            onChange={e => setCourseId(Number(e.target.value))}
          >
            <option value="">Selecione</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sap-form-actions">
        <button
          className="sap-primary"
          onClick={handleSubmit}
          disabled={
            saving ||
            channels.length === 0 ||
            (contentMode === "manual" && (!title.trim() || !message.trim())) ||
            (contentMode === "template" && !selectedTemplateId)
          }
        >
          {saving ? "Salvando..." : initialData?.id ? "Salvar alterações" : "Criar comunicação"}
        </button>
      </div>
    </div>
  )
}

export default CommunicationForm
