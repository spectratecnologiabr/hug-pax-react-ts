import React from "react"
import CommunicationForm from "./CommunicationForm"

type Props = {
  opened: boolean
  onClose: () => void
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
}

function CommunicationModal({ opened, onClose, initialData }: Props) {
  if (!opened) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <b>{initialData ? "Editar Comunicação" : "Nova Comunicação"}</b>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <CommunicationForm
          initialData={initialData}
          onSuccess={onClose}
        />
      </div>
    </div>
  )
}

export default CommunicationModal
