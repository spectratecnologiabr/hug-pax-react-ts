import React, { useEffect, useMemo, useState } from "react"
import { createTeachingModalityAdmin } from "../../controllers/education/createTeachingModalityAdmin.controller"
import { createTeachingGradeAdmin } from "../../controllers/education/createTeachingGradeAdmin.controller"
import { listTeachingModalitiesAdmin } from "../../controllers/education/listTeachingModalitiesAdmin.controller"

import "../../style/educationModal.css"

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean }

type Props = { opened: boolean; onClose: () => void; onCreated?: () => void; defaultTab?: "modality" | "grade" }

function EducationCreateModal({ opened, onClose, onCreated, defaultTab = "modality" }: Props) {
  const [tab, setTab] = useState<"modality" | "grade">(defaultTab)
  const [modName, setModName] = useState("")
  const [modSlug, setModSlug] = useState("")
  const [modSlugTouched, setModSlugTouched] = useState(false)
  const [modalities, setModalities] = useState<TeachingModality[]>([])
  const [gradeModalityId, setGradeModalityId] = useState<number | "">("")
  const [gradeName, setGradeName] = useState("")
  const [gradeOrder, setGradeOrder] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmitModality = useMemo(() => modName.trim().length >= 2 && modSlug.trim().length >= 2, [modName, modSlug])

  const canSubmitGrade = useMemo(
    () => typeof gradeModalityId === "number" && gradeName.trim().length >= 2 && Number.isFinite(gradeOrder) && gradeOrder >= 1,
    [gradeModalityId, gradeName, gradeOrder]
  )

  function resetAll() {
    setTab(defaultTab)
    setModName("")
    setModSlug("")
    setModSlugTouched(false)
    setGradeModalityId("")
    setGradeName("")
    setGradeOrder(1)
    setLoading(false)
    setErrorMsg(null)
  }

  function makeSlug(input: string) {
    return input
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s_-]/g, "")
      .replace(/[\s-]+/g, "_")
      .replace(/_+/g, "_")
  }

  async function loadModalities() {
    try {
      const data = await listTeachingModalitiesAdmin()
      const list: TeachingModality[] = Array.isArray(data?.data) ? data.data : data
      setModalities(list || [])
    } catch {
      setModalities([])
    }
  }

  useEffect(() => {
    if (!opened) return
    setErrorMsg(null)
    loadModalities()
  }, [opened])

  useEffect(() => {
    if (!opened) return
    if (tab === "grade") loadModalities()
  }, [tab, opened])

  useEffect(() => {
    if (modSlugTouched) return
    setModSlug(makeSlug(modName))
  }, [modName, modSlugTouched])

  async function handleCreateModality(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitModality || loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      await createTeachingModalityAdmin({ name: modName.trim(), slug: makeSlug(modSlug) })
      onCreated?.()
      onClose()
      resetAll()
    } catch {
      setErrorMsg("Não consegui criar a modalidade. Confere os campos e tenta de novo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitGrade || loading) return
    setLoading(true)
    setErrorMsg(null)
    try {
      await createTeachingGradeAdmin({ modalityId: Number(gradeModalityId), name: gradeName.trim(), order: Number(gradeOrder) })
      onCreated?.()
      onClose()
      resetAll()
    } catch {
      setErrorMsg("Não consegui criar a série. Confere os campos e tenta de novo.")
    } finally {
      setLoading(false)
    }
  }

  if (!opened) return null

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">Cadastrar</h2>
            <p className="modal-subtitle">Modalidade ou Série</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab ${tab === "modality" ? "active" : ""}`} onClick={() => setTab("modality")} type="button">Modalidade</button>
          <button className={`modal-tab ${tab === "grade" ? "active" : ""}`} onClick={() => setTab("grade")} type="button">Série</button>
        </div>

        {errorMsg && <div className="modal-alert">{errorMsg}</div>}

        {tab === "modality" ? (
          <form className="modal-body" onSubmit={handleCreateModality}>
            <div className="field">
              <label>Nome</label>
              <input value={modName} onChange={(e) => setModName(e.target.value)} placeholder="Ex: Ensino Fundamental I" />
            </div>

            <div className="field">
              <label>Slug</label>
              <input value={modSlug} onChange={(e) => { setModSlugTouched(true); setModSlug(e.target.value.toUpperCase()) }} placeholder="Ex: ENSINO_FUNDAMENTAL_I" />
              <small>Dica: usa um slug estável pra não quebrar filtros no futuro.</small>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" type="button" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" type="submit" disabled={!canSubmitModality || loading}>{loading ? "Salvando..." : "Criar Modalidade"}</button>
            </div>
          </form>
        ) : (
          <form className="modal-body" onSubmit={handleCreateGrade}>
            <div className="field">
              <label>Modalidade</label>
              <select value={gradeModalityId} onChange={(e) => setGradeModalityId(e.target.value ? Number(e.target.value) : "") }>
                <option value="">Selecione...</option>
                {modalities.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Nome da Série</label>
              <input value={gradeName} onChange={(e) => setGradeName(e.target.value)} placeholder="Ex: 1º Ano" />
            </div>

            <div className="field">
              <label>Ordem</label>
              <input type="number" min={1} value={gradeOrder} onChange={(e) => setGradeOrder(Number(e.target.value))} placeholder="1" />
              <small>Define a ordenação na listagem.</small>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" type="button" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" type="submit" disabled={!canSubmitGrade || loading}>{loading ? "Salvando..." : "Criar Série"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EducationCreateModal