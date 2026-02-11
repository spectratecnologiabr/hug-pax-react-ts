import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCourse, ICourseData } from "../controllers/course/admin/createCourse.controller";
import { createModule, IModuleData } from "../controllers/course/admin/createModule.controller";
import { deleteModule } from "../controllers/course/admin/deleteModule.controller";
import { createLesson, ILessonData } from "../controllers/course/admin/createLesson.controller";
import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";
import { uploadLessonFileController } from "../controllers/course/admin/uploadFile.controller";
import { createFile } from "../controllers/course/admin/createFile.controller";
import { updateLessonAllowDownload, updateLessonExtUrl } from "../controllers/course/admin/updateLesson.controller";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type LessonInList = ILessonData & { id?: number };
type ModuleInList = IModuleData & { id?: number; lessons?: LessonInList[] };

type CreateModuleResponse = {
    success?: boolean;
    module?: Array<{ insertId?: number } | null>;
    message?: string;
};

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean };

function NewCoursePage() {
    const [ newCourseData, setNewCoursedata ] = useState<ICourseData>({slug: "", title: "", subTitle: "", cover: "", workload: 0, series: []})
    const [isSeriesOpen, setIsSeriesOpen] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showLessonFormForModuleIndex, setShowLessonFormForModuleIndex] = useState<number | null>(null);
    const [modules, setModules] = useState<ModuleInList[]>([]);
    // Inclui file?: File, mimeType, size, fileName
    const [newLessonData, setNewLessonData] = useState<ILessonData & { file?: File; mimeType?: string; size?: number; fileName?: string }>({
        moduleId: 0,
        title: "",
        slug: "",
        type: "video",
        extUrl: undefined,
        code: undefined,
        cover: undefined,
        isActive: 1,
        allowDownload: true,
        file: undefined,
        mimeType: undefined,
        size: undefined,
        fileName: undefined,
    });
    const [lessonFileUploading, setLessonFileUploading] = useState(false);
    const [newModuleData, setNewModuleData] = useState<IModuleData>({
        title: "",
        description: "",
        courseId: 0,
        order: 1,
    });
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [segments, setSegments] = useState<{ value: string; label: string }[]>([]);
    const seriesRef = useRef<HTMLDivElement | null>(null);

    function handleModalMessage(data: { isError: boolean; message: string }) {
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(data.isError);
        if (messageElement) {
            messageElement.textContent = data.message;
        } else {
            setMessage(data.message);
        }
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
    }

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const modalitiesResp = await listTeachingModalitiesAdmin();
                const modalities: TeachingModality[] = Array.isArray(modalitiesResp?.data)
                    ? modalitiesResp.data
                    : modalitiesResp;

                const activeModalities = (modalities || []).filter((m) => m.isActive !== false);
                const segmentOptions = activeModalities.map((m) => ({ value: String(m.id), label: m.name }));

                if (!alive) return;
                setSegments(segmentOptions);
            } catch {
                if (!alive) return;
                setSegments([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const generateSlug = (value: string): string => {
        return value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    async function toggleLessonDownload(moduleIndex: number, lessonIndex: number) {
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson) return;

        const current = lesson.allowDownload !== false;
        const next = !current;

        setModules(prev =>
            prev.map((m, mi) =>
                mi !== moduleIndex
                    ? m
                    : {
                          ...m,
                          lessons: (m.lessons ?? []).map((l, li) => (li === lessonIndex ? { ...l, allowDownload: next } : l)),
                      }
            )
        );

        if (!lesson.id) return;

        try {
            await updateLessonAllowDownload(lesson.id, next);
        } catch (e) {
            console.error("Erro ao atualizar permissão de download", e);
            handleModalMessage({ isError: true, message: "Não foi possível atualizar a permissão de download" });
            setModules(prev =>
                prev.map((m, mi) =>
                    mi !== moduleIndex
                        ? m
                        : {
                              ...m,
                              lessons: (m.lessons ?? []).map((l, li) => (li === lessonIndex ? { ...l, allowDownload: current } : l)),
                          }
                )
            );
        }
    }


    // Função para criar curso
    async function handleCreateCourse() {
        try {
            const payload = {
                ...newCourseData,
                slug: newCourseData.slug || generateSlug(newCourseData.title),
            };
            const response = await createCourse(payload) as { success?: boolean; data?: { id?: Array<{ insertId?: number }> }; id?: Array<{ insertId?: number }>; message?: string };
            const courseId = response?.data?.id?.[0]?.insertId ?? response?.id?.[0]?.insertId;
            if (response.success && courseId) {
                handleModalMessage({ isError: false, message: "Curso criado com sucesso. Agora adicione o primeiro módulo." });
                setCreatedCourseId(courseId);
                setNewModuleData(prev => ({
                    ...prev,
                    courseId,
                    order: 1,
                }));
                setShowModuleForm(true);
            } else {
                handleModalMessage({ isError: true, message: response.message ?? "Erro ao criar a trilha." });
            }
        } catch (error) {
            console.error("Erro ao criar curso:", error);
            handleModalMessage({ isError: true, message: "Erro ao criar a trilha" });
        }
    }

    // Função para criar módulo
    async function handleCreateModule() {
        try {
            const response = await createModule(newModuleData) as CreateModuleResponse;
            if (response.success) {
                handleModalMessage({ isError: false, message: "Módulo criado com sucesso" });
                const first = response.module?.[0];
                const moduleId = first != null && typeof first === "object" && typeof first.insertId === "number"
                    ? first.insertId
                    : undefined;
                const moduleToAdd: ModuleInList = {
                    ...newModuleData,
                    id: moduleId,
                    lessons: [],
                };
                setModules(prev => [...prev, moduleToAdd]);
                setNewModuleData(prev => ({
                    ...prev,
                    title: "",
                    description: "",
                    order: prev.order + 1,
                }));
            } else {
                handleModalMessage({ isError: true, message: response.message ?? "Erro ao criar o módulo." });
            }
        } catch (error) {
            console.error("Erro ao criar módulo:", error);
            handleModalMessage({ isError: true, message: "Erro ao criar o módulo" });
        }
    }

    // Nova versão de handleCreateLesson: cria a aula primeiro, depois faz upload e registro do arquivo, e atualiza a aula com extUrl via PUT usando id do CDN
    async function handleCreateLesson(idx: number) {
        if (!newLessonData.title?.trim()) {
            handleModalMessage({ isError: true, message: "Informe o título da aula." });
            return;
        }

        const targetModule = modules[idx];
        const moduleId = targetModule?.id;
        if (!moduleId) {
            handleModalMessage({ isError: true, message: "Este módulo ainda não possui ID. Feche o modal de módulos e tente novamente." });
            return;
        }

        setLessonFileUploading(true);
        try {
            // 1️⃣ Cria a aula primeiro (sem extUrl)
            const lessonPayload: ILessonData = {
                ...newLessonData,
                moduleId,
                slug: newLessonData.slug || generateSlug(newLessonData.title),
                extUrl: undefined,
            };
            const lessonResponse = await createLesson(lessonPayload);
            console.log("createLesson response:", lessonResponse);

            const insertResult = lessonResponse.data?.[0];
            if (!insertResult || !("insertId" in insertResult)) {
                handleModalMessage({ isError: true, message: "Erro ao criar a aula." });
                return;
            }
            const lessonId = insertResult.insertId;

            let extUrlFromFileId: string | undefined;

            // 2️⃣ Se tiver arquivo, faz upload no CDN
            if (newLessonData.file) {
                const fileMeta = await uploadLessonFileController(newLessonData.file);

                // 3️⃣ Cria registro na tabela files com lessonId correto
                await createFile({
                  lessonId,
                  courseId: createdCourseId!,
                  fileKey: fileMeta.id,
                  fileType: newLessonData.type,
                  mimeType: newLessonData.file.type,
                  size: newLessonData.file.size,
                });

                // 4️⃣ Atualiza a aula via PUT em /lessons/:id para setar extUrl = id do CDN
                await updateLessonExtUrl(lessonId, fileMeta.id);
                extUrlFromFileId = fileMeta.id;
            }

            // Atualiza o estado dos módulos, usando extUrl = id do CDN se houver arquivo
            setModules(prev =>
                prev.map((m, i) =>
                    i === idx
                        ? { ...m, lessons: [...(m.lessons ?? []), { ...lessonPayload, id: lessonId, extUrl: extUrlFromFileId }] }
                        : m
                )
            );

            handleModalMessage({ isError: false, message: "Aula criada com sucesso" });

            // Reseta o state do form
            setNewLessonData({
                moduleId: 0,
                title: "",
                slug: "",
                type: "video",
                extUrl: undefined,
                code: undefined,
                cover: undefined,
                isActive: 1,
                allowDownload: true,
                file: undefined,
                mimeType: undefined,
                size: undefined,
                fileName: undefined,
            });
            setShowLessonFormForModuleIndex(null);

        } catch (error) {
            console.error("Erro ao criar aula:", error);
            handleModalMessage({ isError: true, message: "Erro ao criar a aula" });
        } finally {
            setLessonFileUploading(false);
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Cadastrar nova trilha</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>
                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Informações gerais da trilha</b>
                            </div>
                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="title">Nome da trilha:*</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={newCourseData.title}
                                        onChange={e => {
                                            const title = e.target.value;
                                            setNewCoursedata(prev => ({
                                                ...prev!,
                                                title,
                                                slug: generateSlug(title),
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="subtitle">Subtítulo da trilha:</label>
                                    <input
                                        type="text"
                                        id="subtitle"
                                        name="subtitle"
                                        value={newCourseData.subTitle}
                                        onChange={e =>
                                            setNewCoursedata(prev => ({
                                                ...prev!,
                                                subTitle: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="cover">Capa da trilha:*</label>
                                    <input
                                        type="file"
                                        name="cover"
                                        id="cover"
                                        accept="image/*"
                                        onChange={async e => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                const compressedFile = await imageCompression(file, {
                                                    maxSizeMB: 0.5,
                                                    maxWidthOrHeight: 800,
                                                    initialQuality: 0.5,
                                                    alwaysKeepResolution: false,
                                                    useWebWorker: true,
                                                });

                                                const base64 = await fileToBase64(compressedFile);

                                                setNewCoursedata(prev => ({
                                                    ...prev!,
                                                    cover: base64,
                                                }));
                                            } catch (error) {
                                                console.error("Erro ao comprimir a imagem:", error);
                                                handleModalMessage({ isError: true, message: "Erro ao processar a imagem da capa" });
                                            }
                                        }}
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="workload">Carga horária:*</label>
                                    <input
                                        type="number"
                                        name="workload"
                                        id="workload"
                                        value={newCourseData.workload}
                                        onChange={e =>
                                            setNewCoursedata(prev => ({
                                                ...prev!,
                                                workload: Number(e.target.value),
                                            }))
                                        }
                                    />
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="courseSeries">Segmentos:*</label>
                                    <div className="custom-multiselect" ref={seriesRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsSeriesOpen(prev => !prev)}
                                        >
                                            {(() => {
                                                const seriesArray = Array.isArray(newCourseData?.series)
                                                    ? newCourseData.series
                                                    : [];

                                                return seriesArray.length
                                                    ? `${seriesArray.length} segmento(s) selecionado(s)`
                                                    : "Selecionar segmentos";
                                            })()}
                                        </button>

                                        {isSeriesOpen && (
                                            <div className="multiselect-popup">
                                                {segments.map(segment => (
                                                    <label key={segment.value} className="multiselect-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                Array.isArray(newCourseData?.series)
                                                                    ? newCourseData.series.includes(segment.value)
                                                                    : false
                                                            }
                                                            onChange={() => {
                                                                const current: string[] = Array.isArray(newCourseData?.series)
                                                                    ? newCourseData.series
                                                                    : [];

                                                                const updated: string[] = current.includes(segment.value)
                                                                    ? current.filter(v => v !== segment.value)
                                                                    : [...current, segment.value];

                                                                setNewCoursedata(prev => ({
                                                                    ...prev!,
                                                                    series: updated,
                                                                }));
                                                            }}
                                                        />
                                                        <span>{segment.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="button-wrapper">
                                <button
                                    className="submit-button"
                                    disabled={createdCourseId != null}
                                    onClick={handleCreateCourse}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                        {/* Listagem de módulos: visível assim que a trilha é criado */}
                        {createdCourseId != null && (
                            <div className="form-wrapper">
                                <div className="title-wrapper">
                                    <b>Módulos cadastrados</b>
                                    <button className="action-button add-module" onClick={() => setShowModuleForm(true)}>Adicionar módulo</button>
                                </div>
                                {modules.length === 0 ? (
                                    <p className="module-list-empty">Nenhum módulo ainda. Adicione o primeiro módulo abaixo.</p>
                                ) : (
                                    <ul className="module-list">
                                        {modules.map((module, index) => (
                                            <li key={module.id ?? `m-${index}`} className="module-item">
                                                <div className="module-item-header">
                                                    <div>
                                                        <strong>{module.order}. {module.title}</strong>
                                                        {module.description && <p>{module.description}</p>}
                                                    </div>
                                                    <div className="module-item-actions">
                                                        <button
                                                            type="button"
                                                            className="action-button add-lesson"
                                                            onClick={() => {
                                                                setNewLessonData(prev => ({
                                                                    ...prev,
                                                                    moduleId: module.id ?? 0,
                                                                    title: "",
                                                                    subTitle: "",
                                                                    slug: "",
                                                                    type: "video",
                                                                }));
                                                                setShowLessonFormForModuleIndex(index);
                                                            }}
                                                        >
                                                            Adicionar aula
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="action-button remove-module"
                                                            onClick={async () => {
                                                                if (module.id == null) return;
                                                                if (!window.confirm(`Remover o módulo "${module.title}"? Isso pode afetar as aulas vinculadas.`)) return;
                                                                try {
                                                                    const res = await deleteModule(module.id) as { success?: boolean; message?: string };
                                                                    if (res?.success !== false) {
                                                                        setModules(prev => prev.filter(m => m.id !== module.id));
                                                                    } else {
                                                                        handleModalMessage({ isError: true, message: res?.message ?? "Erro ao remover o módulo." });
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Erro ao remover módulo:", err);
                                                                    handleModalMessage({ isError: true, message: "Erro ao remover o módulo." });
                                                                }
                                                            }}
                                                        >
                                                            Remover módulo
                                                        </button>
                                                    </div>
                                                </div>
                                                {(module.lessons ?? []).length > 0 && (
                                                    <div className="lesson-cards-grid">
                                                        {module.lessons!.map((lesson, lessonIndex) => (
                                                            <div
                                                                key={lesson.id ?? `l-${lessonIndex}`}
                                                                className="lesson-card"
                                                            >
                                                                <div className="lesson-card-header">
                                                                    <span className="lesson-type-badge">
                                                                        {lesson.type}
                                                                    </span>
                                                                </div>
                                                                <div className="lesson-card-body">
                                                                    <strong>{lesson.title}</strong>
                                                                    {lesson.subTitle && <p>{lesson.subTitle}</p>}
                                                                </div>
                                                                <div className="lesson-card-footer">
                                                                    <label className="lesson-download-toggle" title="Permitir download do ativo">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={lesson.allowDownload !== false}
                                                                            onChange={() => toggleLessonDownload(index, lessonIndex)}
                                                                        />
                                                                        <span className="lesson-toggle-switch" aria-hidden="true" />
                                                                        <span>Download</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {showModuleForm && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b>Cadastrar módulo</b>
                                    </div>

                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="moduleTitle">Nome do módulo:*</label>
                                            <input
                                                type="text"
                                                id="moduleTitle"
                                                value={newModuleData.title}
                                                onChange={e =>
                                                    setNewModuleData(prev => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="input-wrapper">
                                            <label htmlFor="moduleDescription">Descrição do módulo:</label>
                                            <input
                                                type="text"
                                                id="moduleDescription"
                                                value={newModuleData.description}
                                                onChange={e =>
                                                    setNewModuleData(prev => ({
                                                        ...prev,
                                                        description: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="input-wrapper">
                                            <label htmlFor="moduleOrder">Ordem:*</label>
                                            <input
                                                type="number"
                                                id="moduleOrder"
                                                value={newModuleData.order}
                                                onChange={e =>
                                                    setNewModuleData(prev => ({
                                                        ...prev,
                                                        order: Number(e.target.value),
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="button-wrapper">
                                        <button
                                            className="submit-button"
                                            onClick={handleCreateModule}
                                        >
                                            Adicionar módulo
                                        </button>

                                        <button
                                            className="secondary-button"
                                            onClick={() => setShowModuleForm(false)}
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showLessonFormForModuleIndex !== null && (
                            <div className="modal-overlay modal-overlay-lesson" role="dialog" aria-modal="true" aria-labelledby="lesson-modal-title">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b id="lesson-modal-title">Adicionar aula ao módulo</b>
                                    </div>
                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="lessonTitle">Título da aula:*</label>
                                            <input
                                                type="text"
                                                id="lessonTitle"
                                                value={newLessonData.title}
                                                onChange={e => {
                                                    const title = e.target.value;
                                                    setNewLessonData(prev => ({
                                                        ...prev,
                                                        title,
                                                        slug: generateSlug(title),
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="lessonSubTitle">Subtítulo (opcional):</label>
                                            <input
                                                type="text"
                                                id="lessonSubTitle"
                                                value={newLessonData.subTitle ?? ""}
                                                onChange={e =>
                                                    setNewLessonData(prev => ({ ...prev, subTitle: e.target.value || undefined }))
                                                }
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="lessonType">Tipo:*</label>
                                            <select
                                                id="lessonType"
                                                value={newLessonData.type}
                                                onChange={e =>
                                                    setNewLessonData(prev => ({
                                                        ...prev,
                                                        type: e.target.value as "video" | "pdf" | "attachment",
                                                        extUrl: undefined,
                                                        code: undefined,
                                                        cover: undefined,
                                                        isActive: 1,
                                                    }))
                                                }
                                            >
                                                <option value="video">Vídeo</option>
                                                <option value="pdf">PDF</option>
                                                <option value="attachment">Anexo</option>
                                            </select>
                                        </div>
                                        {(newLessonData.type === "pdf" || newLessonData.type === "attachment" || newLessonData.type === "video") && (
                                            <div className="input-wrapper">
                                                <label htmlFor="lessonFile">
                                                    Arquivo (
                                                    {newLessonData.type === "pdf"
                                                        ? "PDF"
                                                        : newLessonData.type === "attachment"
                                                        ? "Anexo"
                                                        : "Vídeo"}
                                                    ):*
                                                </label>
                                                <input
                                                    type="file"
                                                    id="lessonFile"
                                                    accept={
                                                        newLessonData.type === "pdf"
                                                            ? "application/pdf"
                                                            : newLessonData.type === "video"
                                                            ? "video/*"
                                                            : "*"
                                                    }
                                                    disabled={lessonFileUploading}
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setNewLessonData(prev => ({
                                                            ...prev,
                                                            file,
                                                        }));
                                                    }}
                                                />
                                                {newLessonData.file && (
                                                    <div style={{ marginTop: 4 }}>
                                                        Arquivo selecionado: {newLessonData.file.name}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="button-wrapper">
                                        <button
                                            className="submit-button"
                                            disabled={lessonFileUploading}
                                            onClick={() => {
                                                if (showLessonFormForModuleIndex !== null) {
                                                    handleCreateLesson(showLessonFormForModuleIndex);
                                                }
                                            }}
                                        >
                                            Adicionar aula
                                        </button>
                                        <button
                                            className="secondary-button"
                                            onClick={() => {
                                                setShowLessonFormForModuleIndex(null);
            setNewLessonData(prev => ({
                ...prev,
                title: "",
                subTitle: "",
                slug: "",
                type: "video",
                extUrl: undefined,
                code: undefined,
                cover: undefined,
                isActive: 1,
                allowDownload: true,
                file: undefined,
                mimeType: undefined,
                size: undefined,
                fileName: undefined,
            }));
                                            }}
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    )
}

export default NewCoursePage
