import React, { useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import { listColleges } from "../../controllers/college/listColleges.controller"
import { createCommunication } from "../../controllers/communication/createCommunication.controller"
import { updateCommunication } from "../../controllers/communication/updateCommunication.controller"

type Props = {
  initialData?: {
    id?: number
    title: string
    message: string
    link?: string
  }
  onSuccess: () => void
}

function CommunicationForm({ initialData, onSuccess }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [message, setMessage] = useState(initialData?.message ?? "")
  const [link, setLink] = useState(initialData?.link ?? "")
  const [saving, setSaving] = useState(false)
  
  type TargetType = "ALL_STUDENTS" | "SCHOOL"

  const [targetType, setTargetType] = useState<TargetType>("ALL_STUDENTS")
  const [collegeId, setCollegeId] = useState<number | "">("")

  const [colleges, setColleges] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    listColleges().then(setColleges).catch(() => {})
  }, [])

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

  async function handleSubmit() {
    if (!title || !message) return
    setSaving(true)

    const targets:
      { type: "ALL_STUDENTS" | "SCHOOL"; referenceId?: number }[] =
        targetType === "ALL_STUDENTS"
          ? [{ type: "ALL_STUDENTS" }]
          : collegeId
          ? [{ type: "SCHOOL", referenceId: collegeId }]
          : []

    if (!targets.length) return
    
    try {
      if (initialData?.id) {
        await updateCommunication(initialData.id, { title, message, link })
      } else {
        await createCommunication({
          title,
          message,
          link,
          targets: targets
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
        <label>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      <div className="sap-field">
        <label>Mensagem</label>
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
        <label>Público</label>

        <select
          value={targetType}
          onChange={e => {
            setTargetType(e.target.value as TargetType)
            setCollegeId("")
          }}
        >
          <option value="ALL_STUDENTS">Todos os educadores</option>
          <option value="SCHOOL">Por escola</option>
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

      <div className="sap-form-actions">
        <button className="sap-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Salvando..." : initialData?.id ? "Salvar alterações" : "Criar comunicação"}
        </button>
      </div>
    </div>
  )
}

export default CommunicationForm