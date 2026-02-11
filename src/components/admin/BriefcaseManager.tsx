import { useEffect, useMemo, useState } from "react";
import { createBriefcaseFile } from "../../controllers/admin/createBriefcaseFile.controller";
import { deleteBriefcaseFile } from "../../controllers/admin/deleteBriefcaseFile.controller";
import { listBriefcaseFiles, type TAdminBriefcaseFile } from "../../controllers/admin/listBriefcaseFiles.controller";

import "../../style/briefcaseManager.css";

type TNormalizedBriefcaseFile = {
  id: number | string;
  name: string;
  url?: string;
  type?: string;
  createdAt?: string;
};

function normalizeType(value: unknown): string {
  if (typeof value !== "string") return "file";
  const normalized = value.toLowerCase();
  if (normalized.includes("pdf")) return "pdf";
  if (normalized.includes("xls")) return "xlsx";
  if (normalized.includes("doc")) return "doc";
  if (normalized.includes("ppt")) return "ppt";
  if (normalized.includes("link")) return "link";
  return "file";
}

function extensionFromName(name: string): string {
  const parts = name.split(".");
  if (parts.length <= 1) return "FILE";
  return parts[parts.length - 1].toUpperCase();
}

function mapBriefcaseFile(file: TAdminBriefcaseFile & Record<string, any>): TNormalizedBriefcaseFile {
  const name = String(file.name ?? file.fileName ?? file.originalName ?? file.title ?? "Arquivo");
  const url = file.url ?? file.fileUrl ?? file.downloadUrl ?? file.path;
  const type = normalizeType(file.type ?? file.fileType ?? file.extension ?? extensionFromName(name));

  return {
    id: file.id ?? name,
    name,
    url: typeof url === "string" ? url : undefined,
    type,
    createdAt: file.createdAt,
  };
}

function BriefcaseManager() {
  const [files, setFiles] = useState<Array<TNormalizedBriefcaseFile>>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  async function loadFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await listBriefcaseFiles();
      const normalized = (Array.isArray(response) ? response : []).map(mapBriefcaseFile);
      setFiles(normalized);
    } catch (e) {
      console.error("Erro ao listar arquivos da maleta", e);
      setFiles([]);
      setError("Não foi possível carregar os arquivos da maleta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const canUpload = useMemo(() => Boolean(newFile), [newFile]);

  async function handleUpload() {
    if (!newFile) return;
    setUploading(true);
    setError(null);
    try {
      await createBriefcaseFile({
        file: newFile,
        name: newFileName.trim() || newFile.name,
      });
      setNewFile(null);
      setNewFileName("");
      await loadFiles();
    } catch (e) {
      console.error("Erro ao criar arquivo da maleta", e);
      setError("Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(file: TNormalizedBriefcaseFile) {
    if (!window.confirm(`Excluir "${file.name}" da Maleta Digital?`)) return;

    setDeletingId(file.id);
    setError(null);
    try {
      await deleteBriefcaseFile(file.id);
      await loadFiles();
    } catch (e) {
      console.error("Erro ao excluir arquivo da maleta", e);
      setError("Não foi possível excluir o arquivo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="briefcase-manager-card">
      <div className="briefcase-manager-header">
        <div>
          <h3>Maleta Digital</h3>
          <span>Gerencie os arquivos disponíveis para consultores</span>
        </div>
        <button type="button" className="briefcase-refresh-btn" onClick={loadFiles} disabled={loading}>
          Atualizar
        </button>
      </div>

      <div className="briefcase-upload-row">
        <input
          className="briefcase-input"
          placeholder="Nome de exibição (opcional)"
          value={newFileName}
          onChange={e => setNewFileName(e.target.value)}
          disabled={uploading}
        />
        <input
          className="briefcase-file-input"
          type="file"
          onChange={e => setNewFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
        <button type="button" className="briefcase-upload-btn" onClick={handleUpload} disabled={!canUpload || uploading}>
          {uploading ? "Enviando..." : "Adicionar arquivo"}
        </button>
      </div>

      {error && <div className="briefcase-error">{error}</div>}

      <div className="briefcase-files-grid">
        {loading ? (
          <div className="briefcase-empty">Carregando arquivos...</div>
        ) : files.length === 0 ? (
          <div className="briefcase-empty">Nenhum arquivo cadastrado.</div>
        ) : (
          files.map(file => (
            <div className="briefcase-file-item" key={String(file.id)}>
              <div className="briefcase-file-main">
                <div className={`briefcase-file-type ${file.type ?? "file"}`}>{extensionFromName(file.name)}</div>
                <div className="briefcase-file-meta">
                  <b title={file.name}>{file.name}</b>
                  <small>{file.createdAt ? new Date(file.createdAt).toLocaleDateString("pt-BR") : "—"}</small>
                </div>
              </div>
              <div className="briefcase-file-actions">
                {file.url ? (
                  <a href={file.url} target="_blank" rel="noreferrer" className="briefcase-link-btn">
                    Abrir
                  </a>
                ) : (
                  <span className="briefcase-link-btn disabled">Sem link</span>
                )}
                <button
                  type="button"
                  className="briefcase-delete-btn"
                  onClick={() => handleDelete(file)}
                  disabled={deletingId === file.id}
                >
                  {deletingId === file.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BriefcaseManager;

