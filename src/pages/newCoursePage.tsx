import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCourse, ICourseData } from "../controllers/course/admin/createCourse.controller";
import { createModule, IModuleData } from "../controllers/course/admin/createModule.controller";
import { deleteModule } from "../controllers/course/admin/deleteModule.controller";
import { createLesson, ILessonData } from "../controllers/course/admin/createLesson.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";
import axios from "axios";

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
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ newCourseData, setNewCoursedata ] = useState<ICourseData>({slug: "", title: "", subTitle: "", cover: "", workload: 0, series: []})
    const [isSeriesOpen, setIsSeriesOpen] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showLessonFormForModuleIndex, setShowLessonFormForModuleIndex] = useState<number | null>(null);
    const [modules, setModules] = useState<ModuleInList[]>([]);
    const [newLessonData, setNewLessonData] = useState<ILessonData>({
        moduleId: 0,
        title: "",
        slug: "",
        type: "video",
        extUrl: undefined,
        code: undefined,
        cover: undefined,
        isActive: 1,
    });
    const [lessonFileUploading, setLessonFileUploading] = useState(false);
    const [newModuleData, setNewModuleData] = useState<IModuleData>({
        title: "",
        description: "",
        courseId: 0,
        order: 1,
    });
    const seriesRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        fetchOverviewData()
    }, []);

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

    // Função para upload do arquivo de aula
    async function uploadLessonFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
        // Ajuste o endpoint conforme sua API
        const formData = new FormData();
        formData.append("file", file);
        // Exemplo: endpoint: /api/upload
        const response = await axios.post(`${process.env.REACT_APP_CDN_URL}/api/upload`, formData, {
            headers: {
                Authorization: `Bearer ${process.env.REACT_APP_CDN_TOKEN}`,
            },
        });
        // O endpoint retorna um objeto completo de upload conforme descrito no novo schema
        // Pegamos os campos relevantes para consumir no restante do sistema
        const { path, fileName } = response.data.file;
        return {
            fileUrl: `${process.env.REACT_APP_CDN_URL}/${path}`,
            fileName: fileName
        };
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
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
                                    onClick={async () => {
                                        try {
                                            const payload = {
                                                ...newCourseData,
                                                slug: newCourseData.slug || generateSlug(newCourseData.title),
                                            };
                                                    await createCourse(payload)
                                                    .then((response: { success?: boolean; data?: { id?: Array<{ insertId?: number }> }; id?: Array<{ insertId?: number }>; message?: string }) => {
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
                                                    })
                                        } catch (error) {
                                            console.error("Erro ao criar curso:", error);
                                            alert("Erro ao criar o curso");
                                        }
                                    }}
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
                                            onClick={async () => {
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
                                            }}
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
                                                    onChange={async e => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setLessonFileUploading(true);
                                                        try {
                                                            const { fileUrl } = await uploadLessonFile(file);
                                                            setNewLessonData(prev => ({
                                                                ...prev,
                                                                extUrl: fileUrl,
                                                            }));
                                                        } catch (err) {
                                                            alert("Erro ao fazer upload do arquivo.");
                                                            setNewLessonData(prev => ({
                                                                ...prev,
                                                                extUrl: undefined
                                                            }));
                                                        }
                                                        setLessonFileUploading(false);
                                                    }}
                                                />
                                                {lessonFileUploading && <div style={{ marginTop: 4 }}>Enviando arquivo...</div>}
                                                {newLessonData.extUrl && (
                                                    <div style={{ marginTop: 4 }}>
                                                        Arquivo enviado:{" "}
                                                        <a href={newLessonData.extUrl} target="_blank" rel="noopener noreferrer">
                                                            {newLessonData.extUrl}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="button-wrapper">
                                        <button
                                            className="submit-button"
                                            disabled={lessonFileUploading}
                                            onClick={async () => {
                                                if (!newLessonData.title?.trim()) {
                                                    alert("Informe o título da aula.");
                                                    return;
                                                }
                                                // Se for PDF, Anexo ou Vídeo, exige upload de arquivo
                                                if (
                                                    (newLessonData.type === "pdf" ||
                                                        newLessonData.type === "attachment" ||
                                                        newLessonData.type === "video") &&
                                                    (!newLessonData.extUrl)
                                                ) {
                                                    alert("Envie o arquivo antes de cadastrar a aula.");
                                                    return;
                                                }
                                                const targetModule = modules[showLessonFormForModuleIndex];
                                                const moduleId = targetModule?.id;
                                                if (moduleId == null || moduleId === 0) {
                                                    alert("Este módulo ainda não possui ID. Feche o modal de módulos, verifique a lista e tente \"Adicionar aula\" novamente.");
                                                    return;
                                                }
                                                try {
                                                    const payload: ILessonData & { fileUrl?: string; fileName?: string } = {
                                                        ...newLessonData,
                                                        moduleId: moduleId,
                                                        slug: newLessonData.slug || generateSlug(newLessonData.title),
                                                    };
                                                    const serverResponse = await createLesson(payload);
                                                    // Expecting: [insertResult, null]
                                                    const insertResult = Array.isArray(serverResponse) ? serverResponse[0] : null;
                                                    const response = {
                                                        success: insertResult && typeof insertResult === "object" && "insertId" in insertResult ? true : false,
                                                        data: insertResult && typeof insertResult === "object" && "insertId" in insertResult
                                                            ? { ...payload, id: insertResult.insertId }
                                                            : undefined,
                                                        message: insertResult && typeof insertResult === "object" && "insertId" in insertResult
                                                            ? undefined
                                                            : "Erro ao criar a aula.",
                                                    };
                                                    if (response.success) {
                                                        alert("Aula criada com sucesso");
                                                        const lessonToAdd: LessonInList = response.data && typeof response.data === "object"
                                                            ? { ...payload, ...response.data }
                                                            : { ...payload };
                                                        const idx = showLessonFormForModuleIndex;
                                                        setModules(prev =>
                                                            prev.map((m, i) =>
                                                                i === idx
                                                                    ? { ...m, lessons: [...(m.lessons ?? []), lessonToAdd] }
                                                                    : m
                                                            )
                                                        );
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
                                                        }));
                                                        setShowLessonFormForModuleIndex(null);
                                                    } else {
                                                        alert(response.message ?? "Erro ao criar a aula.");
                                                    }
                                                } catch (error) {
                                                    console.error("Erro ao criar aula:", error);
                                                    alert("Erro ao criar a aula");
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