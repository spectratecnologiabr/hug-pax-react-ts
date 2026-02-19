import React, { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { useParams } from "react-router-dom";
import { createModule, IModuleData } from "../controllers/course/admin/createModule.controller";
import { deleteModule } from "../controllers/course/admin/deleteModule.controller";
import { createLesson, ILessonData } from "../controllers/course/admin/createLesson.controller";
import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";
import Menubar from "../components/admin/menubar";
import "../style/adminDash.css";
import { uploadLessonFileController } from "../controllers/course/admin/uploadFile.controller";
import { createFile } from "../controllers/course/admin/createFile.controller";
import { updateLessonAllowDownload, updateLessonExtUrl } from "../controllers/course/admin/updateLesson.controller";
import { updateCourse } from "../controllers/course/admin/updateCourse.controller";
import { deleteLesson } from "../controllers/course/admin/deleteLesson.controller";
import { transcribeLesson } from "../controllers/course/admin/transcribeLesson.controller";
import { createTag, createTagCategory, listTagCategories, listTags, listCourseTags, setCourseTags } from "../controllers/lessonTags/lessonTags.controller";

import { getFullCourseData } from "../controllers/course/admin/getFullCourseData.controller";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type LessonInList = ILessonData & {
  id?: number;
};
type ModuleInList = IModuleData & { id?: number; lessons?: LessonInList[] };

type ICourseData = {
  slug: string;
  title: string;
  subTitle: string;
  cover: string;
  workload: number;
  series: string[];
};

type TeachingModality = { id: number; name: string; slug: string; isActive?: boolean };
type TagCategory = { id: number; name: string; color?: string };
type ConfirmDeleteKind = "module" | "lesson";
type ConfirmDeleteState = {
    open: boolean;
    kind: ConfirmDeleteKind | null;
    moduleIndex: number | null;
    lessonIndex: number | null;
    title: string;
};

function EditCoursePage() {
    const { courseId } = useParams<{ courseId: string }>();
    const [ newCourseData, setNewCoursedata ] = useState<ICourseData>({slug: "", title: "", subTitle: "", cover: "", workload: 0, series: []});
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
    const [modules, setModules] = useState<ModuleInList[]>([]);
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showLessonFormForModuleIndex, setShowLessonFormForModuleIndex] = useState<number | null>(null);
    const [newModuleData, setNewModuleData] = useState<IModuleData>({
        title: "",
        description: "",
        courseId: 0,
        order: 1,
    });
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
    const [transcribingLessonId, setTranscribingLessonId] = useState<number | null>(null);
    const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
    const [availableLessonTags, setAvailableLessonTags] = useState<any[]>([]);
    const [courseDefaultTagIds, setCourseDefaultTagIds] = useState<number[]>([]);
    const [newTagCategoryName, setNewTagCategoryName] = useState("");
    const [newTagCategoryColor, setNewTagCategoryColor] = useState("#3696D3");
    const [newTagName, setNewTagName] = useState("");
    const [newTagCategoryId, setNewTagCategoryId] = useState<number>(0);
    const [showCreateTagCategoryModal, setShowCreateTagCategoryModal] = useState(false);
    const [showCreateTagModal, setShowCreateTagModal] = useState(false);
    const [savingCourseTags, setSavingCourseTags] = useState(false);
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
        open: false,
        kind: null,
        moduleIndex: null,
        lessonIndex: null,
        title: "",
    });
    const [confirmDeleteSubmitting, setConfirmDeleteSubmitting] = useState(false);
    const [confirmDeleteError, setConfirmDeleteError] = useState<string | null>(null);
    const [segments, setSegments] = useState<{ value: string; label: string }[]>([]);
    const seriesRef = useRef<HTMLDivElement | null>(null);
    const [isSeriesOpen, setIsSeriesOpen] = useState(false);
    
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
        function handleClickOutside(event: MouseEvent) {
            if (seriesRef.current && !seriesRef.current.contains(event.target as Node)) {
                setIsSeriesOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    async function refreshTagData() {
        const [categories, tags] = await Promise.all([
            listTagCategories(false),
            listTags({ includeInactive: false }),
        ]);

        const nextCategories = Array.isArray(categories) ? categories : [];
        const nextTags = Array.isArray(tags) ? tags : [];

        setTagCategories(nextCategories);
        setAvailableLessonTags(nextTags);

        if (!newTagCategoryId && nextCategories.length > 0) {
            setNewTagCategoryId(Number(nextCategories[0].id));
        }
    }

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const [categories, tags] = await Promise.all([
                    listTagCategories(false),
                    listTags({ includeInactive: false }),
                ]);
                if (!alive) return;
                const nextCategories = Array.isArray(categories) ? categories : [];
                const nextTags = Array.isArray(tags) ? tags : [];
                setTagCategories(nextCategories);
                setAvailableLessonTags(nextTags);
                if (nextCategories.length > 0) {
                    setNewTagCategoryId(Number(nextCategories[0].id));
                }
            } catch (error) {
                if (!alive) return;
                console.error("Erro ao carregar tags/categorias:", error);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    // Busca dados da trilha e módulos/aulas ao carregar
    useEffect(() => {
      async function fetchCourseData() {
        if (!courseId) return;

        try {
          const data = await getFullCourseData(Number(courseId));

          // trilha agora vem no root da response
          setNewCoursedata({
            slug: data.slug,
            title: data.title,
            subTitle: data.subTitle,
            cover: "", // cover não vem mais na response
            workload: data.workload,
            series: Array.isArray(data.series) ? data.series : [],
          });

          setCreatedCourseId(Number(courseId));

          // Módulos já vêm prontos com lessons
          setModules(
            Array.isArray(data.modules)
              ? data.modules.map((mod: any, index: number) => ({
                  id: mod.id,
                  title: mod.title,
                  order: index + 1,
                  lessons: Array.isArray(mod.lessons)
                    ? mod.lessons.map((l: any) => ({
                        ...l,
                        allowDownload:
                          l.allowDownload ??
                          l.downloadAllowed ??
                          l.isDownloadAllowed ??
                          l.canDownload ??
                          l.allow_download ??
                          true,
                      }))
                    : [],
                }))
              : []
          );

          setNewModuleData(prev => ({
            ...prev,
            courseId: Number(courseId),
            order: Array.isArray(data.modules) ? data.modules.length + 1 : 1,
          }));

          const tags = await listCourseTags(Number(courseId));
          const tagIds = Array.isArray(tags) ? tags.map((tag: any) => Number(tag.id)) : [];
          setCourseDefaultTagIds(tagIds);
        } catch (err) {
          console.error(err);
          handleModalMessage({ isError: true, message: "Erro ao buscar dados da trilha." });
        }
      }

      fetchCourseData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

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

    async function handleCreateTagCategory() {
        if (!newTagCategoryName.trim()) {
            handleModalMessage({ isError: true, message: "Informe o nome da categoria." });
            return;
        }

        try {
            await createTagCategory({
                name: newTagCategoryName.trim(),
                slug: generateSlug(newTagCategoryName),
                color: newTagCategoryColor,
                isActive: true,
                visibleRoles: ["educator", "consultant", "coordinator", "admin"],
            });
            setNewTagCategoryName("");
            setShowCreateTagCategoryModal(false);
            await refreshTagData();
            handleModalMessage({ isError: false, message: "Categoria criada com sucesso." });
        } catch (error) {
            console.error("Erro ao criar categoria de tags:", error);
            handleModalMessage({ isError: true, message: "Erro ao criar categoria." });
        }
    }

    async function handleCreateTag() {
        if (!newTagName.trim()) {
            handleModalMessage({ isError: true, message: "Informe o nome da tag." });
            return;
        }
        if (!newTagCategoryId) {
            handleModalMessage({ isError: true, message: "Selecione uma categoria para a tag." });
            return;
        }

        try {
            await createTag({
                categoryId: newTagCategoryId,
                name: newTagName.trim(),
                slug: generateSlug(newTagName),
                isActive: true,
            });
            setNewTagName("");
            setShowCreateTagModal(false);
            await refreshTagData();
            handleModalMessage({ isError: false, message: "Tag criada com sucesso." });
        } catch (error) {
            console.error("Erro ao criar tag:", error);
            handleModalMessage({ isError: true, message: "Erro ao criar tag." });
        }
    }

    async function handleSaveCourseTags() {
        if (!courseId) {
            handleModalMessage({ isError: true, message: "Trilha inválida para salvar tags." });
            return false;
        }

        setSavingCourseTags(true);
        try {
            await setCourseTags(Number(courseId), courseDefaultTagIds);
            const persisted = await listCourseTags(Number(courseId));
            const persistedIds = Array.isArray(persisted) ? persisted.map((tag: any) => Number(tag.id)) : [];
            setCourseDefaultTagIds(persistedIds);
            handleModalMessage({ isError: false, message: "Tags da trilha salvas com sucesso." });
            return true;
        } catch (error) {
            console.error("Erro ao salvar tags da trilha:", error);
            handleModalMessage({ isError: true, message: "Erro ao salvar tags da trilha." });
            return false;
        } finally {
            setSavingCourseTags(false);
        }
    }

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

    async function handleRemoveLesson(moduleIndex: number, lessonIndex: number) {
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson) return;

        try {
            if (lesson.id != null) {
                await deleteLesson(lesson.id);
            }

            setModules(prev =>
                prev.map((m, mi) =>
                    mi !== moduleIndex
                        ? m
                        : {
                              ...m,
                              lessons: (m.lessons ?? []).filter((_, li) => li !== lessonIndex),
                          }
                )
            );

            handleModalMessage({ isError: false, message: "Aula removida com sucesso" });
        } catch (error) {
            console.error("Erro ao remover aula:", error);
            handleModalMessage({ isError: true, message: "Erro ao remover a aula." });
        }
    }

    async function handleTranscribeLesson(moduleIndex: number, lessonIndex: number) {
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson?.id) {
            handleModalMessage({ isError: true, message: "Aula sem ID para transcrição." });
            return;
        }

        if (String(lesson.type).toLowerCase() !== "video") {
            handleModalMessage({ isError: true, message: "Apenas aulas de vídeo podem ser transcritas." });
            return;
        }

        try {
            setTranscribingLessonId(lesson.id);
            const response = await transcribeLesson(lesson.id);
            const chars = Number(response?.data?.chars || 0);
            const preview = String(response?.data?.preview || "").trim();

            setModules(prev =>
                prev.map((m, mi) =>
                    mi !== moduleIndex
                        ? m
                        : {
                              ...m,
                              lessons: (m.lessons ?? []).map((l, li) =>
                                  li === lessonIndex
                                      ? { ...l, code: preview || l.code || "__transcribed__" }
                                      : l
                              ),
                          }
                )
            );

            handleModalMessage({
                isError: false,
                message: chars > 0
                    ? `Transcrição concluída (${chars} caracteres).`
                    : "Transcrição concluída."
            });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            handleModalMessage({
                isError: true,
                message: apiMessage || "Não foi possível transcrever a aula."
            });
        } finally {
            setTranscribingLessonId(null);
        }
    }

    function openConfirmDelete(kind: ConfirmDeleteKind, moduleIndex: number, lessonIndex?: number) {
        const module = modules[moduleIndex];
        if (!module) return;

        if (kind === "module") {
            setConfirmDelete({
                open: true,
                kind,
                moduleIndex,
                lessonIndex: null,
                title: module.title,
            });
            setConfirmDeleteError(null);
            return;
        }

        const lesson = module.lessons?.[lessonIndex ?? -1];
        if (!lesson) return;

        setConfirmDelete({
            open: true,
            kind,
            moduleIndex,
            lessonIndex: lessonIndex ?? null,
            title: lesson.title,
        });
        setConfirmDeleteError(null);
    }

    function closeConfirmDelete() {
        if (confirmDeleteSubmitting) return;
        setConfirmDelete({
            open: false,
            kind: null,
            moduleIndex: null,
            lessonIndex: null,
            title: "",
        });
        setConfirmDeleteError(null);
    }

    async function handleConfirmDelete() {
        if (!confirmDelete.kind || confirmDelete.moduleIndex == null) return;

        setConfirmDeleteSubmitting(true);
        setConfirmDeleteError(null);

        try {
            if (confirmDelete.kind === "module") {
                const module = modules[confirmDelete.moduleIndex];
                if (!module) return;

                if (module.id != null) {
                    const res = (await deleteModule(module.id)) as { success?: boolean; message?: string };
                    if (res?.success === false) {
                        throw new Error(res?.message || "Erro ao remover o módulo.");
                    }
                }

                setModules(prev => prev.filter((_, index) => index !== confirmDelete.moduleIndex));
                handleModalMessage({ isError: false, message: "Módulo removido com sucesso" });
            } else if (confirmDelete.lessonIndex != null) {
                await handleRemoveLesson(confirmDelete.moduleIndex, confirmDelete.lessonIndex);
            }

            closeConfirmDelete();
        } catch (error: any) {
            console.error("Erro ao confirmar remoção:", error);
            setConfirmDeleteError(error?.message || "Não foi possível concluir a ação. Tente novamente.");
        } finally {
            setConfirmDeleteSubmitting(false);
        }
    }

    // Função para criar módulo
    async function handleCreateModule() {
        try {
            const response = await createModule(newModuleData) as { success?: boolean; module?: Array<{ insertId?: number } | null>; message?: string };
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

    // Criação de aula (igual newCoursePage)
    async function handleCreateLesson(idx: number) {
        if (!newLessonData.title?.trim()) {
            handleModalMessage({ isError: true, message: "Informe o título da aula." });
            return;
        }
        if (!newLessonData.file) {
            handleModalMessage({ isError: true, message: "Selecione um arquivo para a aula antes de continuar." });
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
                ? {
                    ...m,
                    lessons: [
                        ...(m.lessons ?? []),
                        {
                        ...lessonPayload,
                        id: lessonId,
                        extUrl: extUrlFromFileId,
                        },
                    ],
                    }
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

    async function handleSaveCourse() {
        if (!courseId) return;

        try {
            const payload: any = {
                title: newCourseData.title,
                subTitle: newCourseData.subTitle,
                workload: newCourseData.workload,
                series: newCourseData.series,
            };

            // Só envia a capa se o usuário tiver alterado
            if (newCourseData.cover) {
                payload.cover = newCourseData.cover;
            }

            await updateCourse(Number(courseId), payload);

            handleModalMessage({ isError: false, message: "Trilha atualizada com sucesso" });
        } catch (error) {
            console.error("Erro ao atualizar trilha:", error);
            handleModalMessage({ isError: true, message: "Erro ao salvar alterações da trilha" });
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar />
                <div className="admin-dashboard-wrapper">
                    <div className="form-container">
                        <div className="title-wrapper">
                            <b>Editar trilha</b>
                            <button onClick={() => {window.history.back()}}>Voltar</button>
                        </div>
                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Informações gerais da trilha</b>
                                <button className="action-button" onClick={handleSaveCourse}>
                                    Salvar alterações
                                </button>
                            </div>
                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="title">Nome da trilha:*</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={newCourseData.title}
                                        onChange={e =>
                                            setNewCoursedata(prev => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
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
                                                ...prev,
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
                                                    ...prev,
                                                    cover: base64,
                                                }));
                                            } catch (error) {
                                                console.error("Erro ao comprimir a imagem:", error);
                                                handleModalMessage({ isError: true, message: "Erro ao processar a imagem da capa" });
                                            }
                                        }}
                                    />
                                    {newCourseData.cover && (
                                        <img src={newCourseData.cover} alt="Capa" style={{maxWidth: 100, marginTop: 6}} />
                                    )}
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
                                                ...prev,
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
                                                            checked={newCourseData.series.includes(segment.value)}
                                                            onChange={() => {
                                                                setNewCoursedata(prev => {
                                                                    const exists = prev.series.includes(segment.value);
                                                                    return {
                                                                        ...prev,
                                                                        series: exists
                                                                            ? prev.series.filter(s => s !== segment.value)
                                                                            : [...prev.series, segment.value],
                                                                    };
                                                                });
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
                        </div>
                        <div className="form-wrapper">
                            <div className="title-wrapper">
                                <b>Tags da trilha</b>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="action-button" type="button" onClick={() => setShowCreateTagCategoryModal(true)}>
                                        Nova categoria
                                    </button>
                                    <button className="action-button" type="button" onClick={() => setShowCreateTagModal(true)}>
                                        Nova tag
                                    </button>
                                    <button
                                        className="action-button"
                                        type="button"
                                        disabled={savingCourseTags}
                                        onClick={() => { void handleSaveCourseTags(); }}
                                    >
                                        {savingCourseTags ? "Salvando..." : "Salvar tags"}
                                    </button>
                                </div>
                            </div>
                            {availableLessonTags.length > 0 ? (
                                <div className="input-wrapper">
                                    <label>Tags padrão da trilha:</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                                        {availableLessonTags.map(tag => {
                                            const tagId = Number(tag.id);
                                            const checked = courseDefaultTagIds.includes(tagId);
                                            return (
                                                <label
                                                    key={`edit-default-course-tag-${tagId}`}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        border: "1px solid #d9dde3",
                                                        borderRadius: 999,
                                                        padding: "6px 10px",
                                                        background: checked ? "#eef7fd" : "#fff",
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => {
                                                            setCourseDefaultTagIds((prev) => event.target.checked
                                                                ? Array.from(new Set([...prev, tagId]))
                                                                : prev.filter((id) => id !== tagId));
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: "#fff",
                                                        background: tag.categoryColor || "#3696D3",
                                                        borderRadius: 999,
                                                        padding: "2px 8px",
                                                        fontSize: 12,
                                                    }}>
                                                        {tag.name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="module-list-empty">Nenhuma tag cadastrada. Crie uma categoria e uma tag para começar.</p>
                            )}
                        </div>
                        {/* Listagem de módulos: sempre visível */}
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
                                                            onClick={() => openConfirmDelete("module", index)}
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
                                                            <div className="lesson-thumbnail-wrapper">
                                                              <span className="lesson-type-badge absolute">
                                                                {lesson.type}
                                                              </span>

                                                              <div className={`lesson-thumbnail-fallback ${lesson.type}`}>
                                                                {lesson.type === 'pdf' && <span>📄</span>}
                                                                {lesson.type === 'attachment' && <span>📎</span>}
                                                                {lesson.type === 'video' && <span>🎬</span>}
                                                              </div>
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
                                                              {lesson.type === "video" && (
                                                                (() => {
                                                                  const isTranscribing = transcribingLessonId === lesson.id;
                                                                  const hasTranscript = Boolean(String(lesson.code || "").trim());
                                                                  const title = isTranscribing
                                                                    ? "Transcrevendo vídeo"
                                                                    : hasTranscript
                                                                      ? "Vídeo já transcrito"
                                                                      : "Transcrever vídeo";
                                                                  return (
                                                                <button
                                                                  type="button"
                                                                  className="action-button add-lesson"
                                                                  disabled={isTranscribing}
                                                                  onClick={() => handleTranscribeLesson(index, lessonIndex)}
                                                                  title={title}
                                                                  aria-label={title}
                                                                >
                                                                  {isTranscribing ? "⏳" : hasTranscript ? "✅" : "📝"}
                                                                </button>
                                                                  );
                                                                })()
                                                              )}
                                                              <button
                                                                type="button"
                                                                className="action-button remove-lesson"
                                                                onClick={() => openConfirmDelete("lesson", index, lessonIndex)}
                                                                title="Remover aula"
                                                                aria-label="Remover aula"
                                                              >
                                                                🗑️
                                                              </button>
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

                        {showCreateTagCategoryModal && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b>Nova categoria de tags</b>
                                    </div>
                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="editNewTagCategoryName">Nome:</label>
                                            <input
                                                type="text"
                                                id="editNewTagCategoryName"
                                                value={newTagCategoryName}
                                                placeholder="Ex.: Competências"
                                                onChange={e => setNewTagCategoryName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="editNewTagCategoryColor">Cor:</label>
                                            <input
                                                type="color"
                                                id="editNewTagCategoryColor"
                                                value={newTagCategoryColor}
                                                onChange={e => setNewTagCategoryColor(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="button-wrapper">
                                        <button className="submit-button" type="button" onClick={handleCreateTagCategory}>
                                            Criar categoria
                                        </button>
                                        <button className="secondary-button" type="button" onClick={() => setShowCreateTagCategoryModal(false)}>
                                            Fechar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showCreateTagModal && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b>Nova tag</b>
                                    </div>
                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="editNewTagName">Nome:</label>
                                            <input
                                                type="text"
                                                id="editNewTagName"
                                                value={newTagName}
                                                placeholder="Ex.: Leitura"
                                                onChange={e => setNewTagName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="editNewTagCategoryId">Categoria:</label>
                                            <select
                                                id="editNewTagCategoryId"
                                                value={newTagCategoryId || ""}
                                                onChange={e => setNewTagCategoryId(Number(e.target.value))}
                                            >
                                                <option value="">Selecione</option>
                                                {tagCategories.map(category => (
                                                    <option key={`edit-tag-category-${category.id}`} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="button-wrapper">
                                        <button className="submit-button" type="button" onClick={handleCreateTag}>
                                            Criar tag
                                        </button>
                                        <button className="secondary-button" type="button" onClick={() => setShowCreateTagModal(false)}>
                                            Fechar
                                        </button>
                                    </div>
                                </div>
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
            {confirmDelete.open && (
                <div
                    className="admin-dashboard-container sap-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) closeConfirmDelete();
                    }}
                >
                    <div className="sap-modal-card">
                        <div className="sap-modal-header">
                            <b>{confirmDelete.kind === "module" ? "Remover módulo?" : "Remover aula?"}</b>
                            <button className="sap-modal-close" onClick={closeConfirmDelete} aria-label="Fechar" disabled={confirmDeleteSubmitting}>
                                ×
                            </button>
                        </div>
                        <div className="sap-modal-body">
                            <div className="sap-modal-user">
                                <div className="sap-avatar" aria-hidden="true">
                                    {confirmDelete.kind === "module" ? "M" : "A"}
                                </div>
                                <div className="sap-modal-user-meta">
                                    <b>{confirmDelete.title}</b>
                                    <span>{confirmDelete.kind === "module" ? "Módulo da trilha" : "Aula do módulo"}</span>
                                </div>
                            </div>
                            <p className="sap-modal-desc">
                                {confirmDelete.kind === "module"
                                    ? "Essa ação pode remover vínculos com as aulas associadas."
                                    : "Essa ação não pode ser desfeita."}
                            </p>
                            {confirmDeleteError && <div className="sap-modal-error">{confirmDeleteError}</div>}
                        </div>
                        <div className="sap-modal-actions">
                            <button className="sap-secondary" onClick={closeConfirmDelete} disabled={confirmDeleteSubmitting}>
                                Cancelar
                            </button>
                            <button className="sap-danger" onClick={handleConfirmDelete} disabled={confirmDeleteSubmitting}>
                                {confirmDeleteSubmitting ? "Processando..." : "Remover"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

export default EditCoursePage;
