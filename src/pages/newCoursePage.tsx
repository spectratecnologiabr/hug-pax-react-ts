import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCourse, ICourseData } from "../controllers/course/admin/createCourse.controller";
import { createModule, IModuleData } from "../controllers/course/admin/createModule.controller";
import { deleteModule } from "../controllers/course/admin/deleteModule.controller";
import { createLesson, ILessonData } from "../controllers/course/admin/createLesson.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";
import { uploadLessonFileController } from "../controllers/course/admin/uploadFile.controller";
import { createFile } from "../controllers/course/admin/createFile.controller";
import { updateLessonExtUrl } from "../controllers/course/admin/updateLesson.controller";

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
    const seriesRef = useRef<HTMLDivElement | null>(null);

    const segments = [
        { value: "EDUCACAO_INFANTIL", label: "Educação Infantil" },
        { value: "ENSINO_FUNDAMENTAL_I", label: "Ensino Fundamental I" },
        { value: "ENSINO_FUNDAMENTAL_II", label: "Ensino Fundamental II" },
        { value: "ENSINO_MEDIO", label: "Ensino Médio" },
        { value: "EDUCACAO_PROFISSIONAL", label: "Educação Profissional" },
        { value: "EJA", label: "Educação de Jovens e Adultos" },
    ];

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
                alert("Curso criado com sucesso. Agora adicione o primeiro módulo.");
                setCreatedCourseId(courseId);
                setNewModuleData(prev => ({
                    ...prev,
                    courseId,
                    order: 1,
                }));
                setShowModuleForm(true);
            } else {
                alert(response.message ?? "Erro ao criar o curso.");
            }
        } catch (error) {
            console.error("Erro ao criar curso:", error);
            alert("Erro ao criar o curso");
        }
    }

    // Função para criar módulo
    async function handleCreateModule() {
        try {
            const response = await createModule(newModuleData) as CreateModuleResponse;
            if (response.success) {
                alert("Módulo criado com sucesso");
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
                alert(response.message ?? "Erro ao criar o módulo.");
            }
        } catch (error) {
            console.error("Erro ao criar módulo:", error);
            alert("Erro ao criar o módulo");
        }
    }

    // Nova versão de handleCreateLesson: cria a aula primeiro, depois faz upload e registro do arquivo, e atualiza a aula com extUrl via PUT usando id do CDN
    async function handleCreateLesson(idx: number) {
        if (!newLessonData.title?.trim()) {
            alert("Informe o título da aula.");
            return;
        }

        const targetModule = modules[idx];
        const moduleId = targetModule?.id;
        if (!moduleId) {
            alert("Este módulo ainda não possui ID. Feche o modal de módulos e tente novamente.");
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
                alert("Erro ao criar a aula.");
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

            alert("Aula criada com sucesso");

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
                file: undefined,
                mimeType: undefined,
                size: undefined,
                fileName: undefined,
            });
            setShowLessonFormForModuleIndex(null);

        } catch (error) {
            console.error("Erro ao criar aula:", error);
            alert("Erro ao criar a aula");
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
                            <b>Cadastrar novo curso</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>
                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Informações gerais do curso</b>
                            </div>
                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="title">Nome do curso:*</label>
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
                                    <label htmlFor="subtitle">Subtítulo do curso:</label>
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
                                    <label htmlFor="cover">Capa do curso:*</label>
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
                                                alert("Erro ao processar a imagem da capa");
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
                        {/* Listagem de módulos: visível assim que o curso é criado */}
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
                                                                        alert(res?.message ?? "Erro ao remover o módulo.");
                                                                    }
                                                                } catch (err) {
                                                                    console.error("Erro ao remover módulo:", err);
                                                                    alert("Erro ao remover o módulo.");
                                                                }
                                                            }}
                                                        >
                                                            Remover módulo
                                                        </button>
                                                    </div>
                                                </div>
                                                {(module.lessons ?? []).length > 0 && (
                                                    <ul className="lesson-sublist">
                                                        {module.lessons!.map((lesson, lessonIndex) => (
                                                            <li key={lesson.id ?? `l-${lessonIndex}`} className="lesson-sublist-item">
                                                                <span className="lesson-sublist-title">{lesson.title}</span>
                                                                {lesson.subTitle && <span className="lesson-sublist-sub">{lesson.subTitle}</span>}
                                                                <span className="lesson-sublist-type">{lesson.type}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
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
        </React.Fragment>
    )
}

export default NewCoursePage