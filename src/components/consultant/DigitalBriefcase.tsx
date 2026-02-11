import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCookies } from "../../controllers/misc/cookies.controller";
import "../../style/digitalBriefcase.css";

export type TDigitalBriefcaseFileType = "pdf" | "xlsx" | "doc" | "ppt" | "link" | "file";

export type TDigitalBriefcaseFile = {
  id: string | number;
  name: string;
  url?: string;
  mimeType?: string;
  onClick?: () => void;
  type?: TDigitalBriefcaseFileType;
};

type DigitalBriefcaseProps = {
  title?: string;
  files: Array<TDigitalBriefcaseFile>;
  initialOpen?: boolean;
  className?: string;
};

function resolveFileType(file: TDigitalBriefcaseFile): TDigitalBriefcaseFileType {
  if (file.type) return file.type;
  const mimeType = file.mimeType?.toLowerCase();
  if (mimeType) {
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("sheet")) return "xlsx";
    if (mimeType.includes("word") || mimeType.includes("msword")) return "doc";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "ppt";
    if (mimeType.includes("url")) return "link";
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
  if (lower.endsWith(".ppt") || lower.endsWith(".pptx")) return "ppt";
  if (file.url && (file.url.startsWith("http://") || file.url.startsWith("https://"))) return "link";
  return "file";
}

function extensionLabel(type: TDigitalBriefcaseFileType) {
  if (type === "pdf") return "PDF";
  if (type === "xlsx") return "XLSX";
  if (type === "doc") return "DOC";
  if (type === "ppt") return "PPT";
  if (type === "link") return "LINK";
  return "FILE";
}

function DigitalBriefcase({
  title = "Maleta Digital",
  files,
  initialOpen = false,
  className = "",
}: DigitalBriefcaseProps) {
  const [open, setOpen] = useState(initialOpen);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const floatingButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (floatingButtonRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const normalizedFiles = useMemo(
    () =>
      files.map(file => ({
        ...file,
        fileType: resolveFileType(file),
      })),
    [files]
  );

  async function forceDownload(url: string, filename?: string) {
    try {
      let downloadUrl = url;
      let headers: HeadersInit | undefined;
      const cdnBaseUrl = process.env.REACT_APP_CDN_URL || "";
      const isAbsolute = downloadUrl.startsWith("https://") || downloadUrl.startsWith("http://");

      if (!isAbsolute) {
        downloadUrl = `${cdnBaseUrl}/api/stream/${downloadUrl}`;
        headers = { Authorization: `Bearer ${getCookies("authToken")}` };
      } else if (cdnBaseUrl && downloadUrl.startsWith(`${cdnBaseUrl}/api/stream/`)) {
        headers = { Authorization: `Bearer ${getCookies("authToken")}` };
      }

      const response = await fetch(downloadUrl, { headers });
      if (!response.ok) throw new Error("Erro ao baixar arquivo da maleta");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erro no download da maleta digital:", error);
    }
  }

  return (
    <div className={`digital-briefcase ${className}`.trim()}>
      <button
        ref={floatingButtonRef}
        className="digital-briefcase-fab"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "Fechar Maleta Digital" : "Abrir Maleta Digital"}
        onClick={() => setOpen(prev => !prev)}
      >
        <svg width="26" height="22" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9.375 3C9.375 1.89543 10.2704 1 11.375 1H14.625C15.7296 1 16.625 1.89543 16.625 3V4.5H9.375V3Z" stroke="white" strokeWidth="1.8" />
          <path d="M1 8.5C1 7.39543 1.89543 6.5 3 6.5H23C24.1046 6.5 25 7.39543 25 8.5V17.5C25 19.433 23.433 21 21.5 21H4.5C2.567 21 1 19.433 1 17.5V8.5Z" stroke="white" strokeWidth="1.8" />
          <path d="M1 11H25" stroke="white" strokeWidth="1.8" />
        </svg>
      </button>

      {open && (
        <div ref={rootRef} className="digital-briefcase-popup" role="dialog" aria-modal="false" aria-label={title}>
          <div className="digital-briefcase-header">
            <div className="digital-briefcase-title">
              <svg width="24" height="20" viewBox="0 0 26 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9.375 3C9.375 1.89543 10.2704 1 11.375 1H14.625C15.7296 1 16.625 1.89543 16.625 3V4.5H9.375V3Z" stroke="white" strokeWidth="1.8" />
                <path d="M1 8.5C1 7.39543 1.89543 6.5 3 6.5H23C24.1046 6.5 25 7.39543 25 8.5V17.5C25 19.433 23.433 21 21.5 21H4.5C2.567 21 1 19.433 1 17.5V8.5Z" stroke="white" strokeWidth="1.8" />
                <path d="M1 11H25" stroke="white" strokeWidth="1.8" />
              </svg>
              <span>{title}</span>
            </div>
            <button type="button" className="digital-briefcase-close" onClick={() => setOpen(false)} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="digital-briefcase-content">
            {normalizedFiles.length === 0 && <p className="digital-briefcase-empty">Nenhum arquivo disponível.</p>}

            {normalizedFiles.map(file => (
              <button
                key={file.id}
                type="button"
                className="digital-briefcase-file-card"
                onClick={() => {
                  if (file.onClick) {
                    file.onClick();
                    return;
                  }
                  if (file.url) forceDownload(file.url, file.name);
                }}
                disabled={!file.onClick && !file.url}
              >
                <div className={`digital-briefcase-file-icon ${file.fileType}`}>
                  <span className="digital-briefcase-file-badge">{extensionLabel(file.fileType)}</span>
                </div>
                <span className="digital-briefcase-file-name">{file.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DigitalBriefcase;
