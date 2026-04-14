import React, { useMemo, useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { createCourse, ICourseData } from "../controllers/course/admin/createCourse.controller";
import { createModule, IModuleData } from "../controllers/course/admin/createModule.controller";
import { deleteModule } from "../controllers/course/admin/deleteModule.controller";
import { createLesson, ILessonData } from "../controllers/course/admin/createLesson.controller";
import { listTeachingModalitiesAdmin } from "../controllers/education/listTeachingModalitiesAdmin.controller";
import { listTeachingGradesAdmin } from "../controllers/education/listTeachingGradesAdmin.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";
import { uploadLessonFileController } from "../controllers/course/admin/uploadFile.controller";
import { createFile } from "../controllers/course/admin/createFile.controller";
import { deleteFile } from "../controllers/course/admin/deleteFile.controller";
import { updateLessonAllowDownload, updateLessonCode, updateLessonExtUrl } from "../controllers/course/admin/updateLesson.controller";
import { deleteLesson } from "../controllers/course/admin/deleteLesson.controller";
import { transcribeLesson } from "../controllers/course/admin/transcribeLesson.controller";
import { createTag, createTagCategory, listTagCategories, listTags, listCourseTags, setCourseTags } from "../controllers/lessonTags/lessonTags.controller";
import { COURSE_CATEGORY_OPTIONS } from "../utils/courseCategory";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type LessonAttachment = {
    id: number;
    title?: string | null;
    fileKey: string;
    fileType: string;
    mimeType?: string | null;
    size?: number | null;
};
type LessonInList = ILessonData & { id?: number; attachments?: LessonAttachment[] };
type ModuleInList = IModuleData & { id?: number; lessons?: LessonInList[] };

type CreateModuleResponse = {
    success?: boolean;
    module?: Array<{ insertId?: number } | null>;
    message?: string;
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
type TranscriptionReviewState = {
    open: boolean;
    moduleIndex: number | null;
    lessonIndex: number | null;
    lessonId: number | null;
    lessonTitle: string;
    text: string;
};

function NewCoursePage() {
    const [ newCourseData, setNewCoursedata ] = useState<ICourseData>({slug: "", title: "", category: "course", subTitle: "", cover: "", workload: 0, series: []})
    const [isSegmentsOpen, setIsSegmentsOpen] = useState(false);
    const [isGradesOpen, setIsGradesOpen] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showLessonFormForModuleIndex, setShowLessonFormForModuleIndex] = useState<number | null>(null);
    const [editModuleIndex, setEditModuleIndex] = useState<number | null>(null);
    const [editLessonTarget, setEditLessonTarget] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);
    const [modules, setModules] = useState<ModuleInList[]>([]);
    // Inclui file?: File, mimeType, size, fileName
    const [newLessonData, setNewLessonData] = useState<ILessonData & { file?: File; mimeType?: string; size?: number; fileName?: string; attachmentFiles?: File[] }>({
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
        attachmentFiles: [],
        mimeType: undefined,
        size: undefined,
        fileName: undefined,
    });
    const [lessonFileUploading, setLessonFileUploading] = useState(false);
    const [attachmentUploadingKey, setAttachmentUploadingKey] = useState<string | null>(null);
    const [transcribingLessonId, setTranscribingLessonId] = useState<number | null>(null);
    const [transcriptionLoadingOpen, setTranscriptionLoadingOpen] = useState(false);
    const [savingTranscriptionReview, setSavingTranscriptionReview] = useState(false);
    const [transcriptionReview, setTranscriptionReview] = useState<TranscriptionReviewState>({
        open: false,
        moduleIndex: null,
        lessonIndex: null,
        lessonId: null,
        lessonTitle: "",
        text: "",
    });
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
    const [newModuleData, setNewModuleData] = useState<IModuleData>({
        title: "",
        description: "",
        courseId: 0,
        order: 1,
    });
    const [editModuleData, setEditModuleData] = useState<{ title: string; description: string; order: number }>({
        title: "",
        description: "",
        order: 1,
    });
    const [editLessonData, setEditLessonData] = useState<{ title: string; subTitle: string }>({
        title: "",
        subTitle: "",
    });
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
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [gradesBySegment, setGradesBySegment] = useState<Record<string, Array<{ value: string; label: string }>>>({});
    const segmentsRef = useRef<HTMLDivElement | null>(null);
    const gradesRef = useRef<HTMLDivElement | null>(null);
    const [segmentsTouched, setSegmentsTouched] = useState(false);

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

    function openEditModuleModal(moduleIndex: number) {
        const module = modules[moduleIndex];
        if (!module) return;
        setEditModuleIndex(moduleIndex);
        setEditModuleData({
            title: String(module.title || ""),
            description: String(module.description || ""),
            order: Number(module.order) || moduleIndex + 1,
        });
    }

    function openEditLessonModal(moduleIndex: number, lessonIndex: number) {
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson) return;
        setEditLessonTarget({ moduleIndex, lessonIndex });
        setEditLessonData({
            title: String(lesson.title || ""),
            subTitle: String(lesson.subTitle || ""),
        });
    }

    function handleSaveLocalModuleDetails() {
        if (editModuleIndex == null) return;
        if (!String(editModuleData.title || "").trim()) {
            handleModalMessage({ isError: true, message: "Informe o nome do módulo." });
            return;
        }
        setModules(prev =>
            prev.map((module, index) =>
                index === editModuleIndex
                    ? {
                        ...module,
                        title: String(editModuleData.title || "").trim(),
                        description: String(editModuleData.description || "").trim(),
                        order: Number(editModuleData.order) || index + 1,
                    }
                    : module
            )
        );
        setEditModuleIndex(null);
        handleModalMessage({ isError: false, message: "Módulo atualizado no rascunho da trilha." });
    }

    function handleSaveLocalLessonDetails() {
        if (!editLessonTarget) return;
        if (!String(editLessonData.title || "").trim()) {
            handleModalMessage({ isError: true, message: "Informe o título da aula." });
            return;
        }
        setModules(prev =>
            prev.map((module, index) =>
                index !== editLessonTarget.moduleIndex
                    ? module
                    : {
                        ...module,
                        lessons: (module.lessons ?? []).map((lesson, lessonIndex) =>
                            lessonIndex === editLessonTarget.lessonIndex
                                ? {
                                    ...lesson,
                                    title: String(editLessonData.title || "").trim(),
                                    subTitle: String(editLessonData.subTitle || "").trim() || undefined,
                                }
                                : lesson
                        ),
                    }
            )
        );
        setEditLessonTarget(null);
        handleModalMessage({ isError: false, message: "Aula atualizada no rascunho da trilha." });
    }

    function getApiErrorMessage(error: any, fallback: string) {
        return String(
            error?.response?.data?.message ||
            error?.message ||
            fallback
        );
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (segmentsRef.current && !segmentsRef.current.contains(target)) {
                setIsSegmentsOpen(false);
            }
            if (gradesRef.current && !gradesRef.current.contains(target)) {
                setIsGradesOpen(false);
            }
        };
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

                const gradesEntries = await Promise.all(
                    activeModalities.map(async (modality) => {
                        try {
                            const gradesResp = await listTeachingGradesAdmin(modality.id);
                            const gradesPayload = Array.isArray(gradesResp?.data)
                                ? gradesResp.data
                                : Array.isArray(gradesResp)
                                    ? gradesResp
                                    : [];
                            const options = gradesPayload.map((grade: any) => ({
                                value: String(grade?.id),
                                label: String(grade?.name ?? `Série ${grade?.id}`),
                            }));
                            return [String(modality.id), options] as const;
                        } catch {
                            return [String(modality.id), []] as const;
                        }
                    })
                );

                if (!alive) return;
                setSegments(segmentOptions);
                setGradesBySegment(Object.fromEntries(gradesEntries));
            } catch {
                if (!alive) return;
                setSegments([]);
                setGradesBySegment({});
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const availableGrades = useMemo(() => {
        if (!selectedSegments.length) return [] as Array<{ value: string; label: string }>;
        const seen = new Set<string>();
        const result: Array<{ value: string; label: string }> = [];

        selectedSegments.forEach((segmentId) => {
            (gradesBySegment[String(segmentId)] || []).forEach((grade) => {
                if (seen.has(grade.value)) return;
                seen.add(grade.value);
                result.push(grade);
            });
        });
        return result;
    }, [gradesBySegment, selectedSegments]);

    useEffect(() => {
        if (!selectedSegments.length) {
            if (segmentsTouched && newCourseData.series.length > 0) {
                setNewCoursedata((prev) => ({ ...prev, series: [] }));
            }
            return;
        }

        const allowed = new Set(availableGrades.map((item) => item.value));
        const filteredSeries = newCourseData.series.filter((item) => allowed.has(item));
        if (filteredSeries.length !== newCourseData.series.length) {
            setNewCoursedata((prev) => ({ ...prev, series: filteredSeries }));
        }
    }, [availableGrades, newCourseData.series, selectedSegments.length, segmentsTouched]);

    function toggleSegmentSelection(segmentId: string) {
        setSegmentsTouched(true);
        setSelectedSegments((prev) => {
            const next = prev.includes(segmentId)
                ? prev.filter((id) => id !== segmentId)
                : [...prev, segmentId];
            return next;
        });
    }

    function toggleGradeSelection(gradeId: string) {
        setNewCoursedata((prev) => {
            const exists = prev.series.includes(gradeId);
            return {
                ...prev,
                series: exists ? prev.series.filter((id) => id !== gradeId) : [...prev.series, gradeId],
            };
        });
    }

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

    const resolveUploadedFileKey = (fileMeta: any): string => {
        const candidates = [
            fileMeta?.fileKey,
            fileMeta?.key,
            fileMeta?.path,
            fileMeta?.id,
        ];

        for (const candidate of candidates) {
            const value = String(candidate ?? "").trim();
            if (value) return value;
        }

        throw new Error("Upload sem fileKey válido.");
    };

    async function uploadAttachmentsForLesson(lessonId: number, files: File[]) {
        if (!createdCourseId || !files.length) return [];

        const uploaded: LessonAttachment[] = [];
        for (const file of files) {
            const fileMeta = await uploadLessonFileController(file);
            const uploadedFileKey = resolveUploadedFileKey(fileMeta);
            const created = await createFile({
                lessonId,
                courseId: createdCourseId,
                title: file.name,
                fileKey: uploadedFileKey,
                fileType: "attachment",
                mimeType: file.type,
                size: file.size,
            });

            uploaded.push({
                id: Number(created.id),
                title: created.title ?? file.name,
                fileKey: created.fileKey ?? uploadedFileKey,
                fileType: created.fileType ?? "attachment",
                mimeType: created.mimeType ?? file.type,
                size: created.size ?? file.size,
            });
        }

        return uploaded;
    }

    async function handleUploadAttachments(moduleIndex: number, lessonIndex: number, files: FileList | null) {
        const selectedFiles = Array.from(files ?? []);
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson?.id || !selectedFiles.length) return;

        const uploadKey = `${moduleIndex}-${lessonIndex}`;
        setAttachmentUploadingKey(uploadKey);
        try {
            const uploaded = await uploadAttachmentsForLesson(lesson.id, selectedFiles);
            if (!uploaded.length) return;

            setModules(prev =>
                prev.map((module, mi) =>
                    mi !== moduleIndex
                        ? module
                        : {
                              ...module,
                              lessons: (module.lessons ?? []).map((currentLesson, li) =>
                                  li !== lessonIndex
                                      ? currentLesson
                                      : {
                                            ...currentLesson,
                                            attachments: [...(currentLesson.attachments ?? []), ...uploaded],
                                        }
                              ),
                          }
                )
            );

            handleModalMessage({ isError: false, message: "Anexos adicionados com sucesso." });
        } catch (error) {
            console.error("Erro ao adicionar anexos:", error);
            handleModalMessage({ isError: true, message: getApiErrorMessage(error, "Erro ao adicionar anexos.") });
        } finally {
            setAttachmentUploadingKey(null);
        }
    }

    async function handleDeleteAttachment(moduleIndex: number, lessonIndex: number, attachmentId: number) {
        try {
            await deleteFile(attachmentId);
            setModules(prev =>
                prev.map((module, mi) =>
                    mi !== moduleIndex
                        ? module
                        : {
                              ...module,
                              lessons: (module.lessons ?? []).map((lesson, li) =>
                                  li !== lessonIndex
                                      ? lesson
                                      : {
                                            ...lesson,
                                            attachments: (lesson.attachments ?? []).filter((attachment) => attachment.id !== attachmentId),
                                        }
                              ),
                          }
                )
            );
            handleModalMessage({ isError: false, message: "Anexo removido com sucesso." });
        } catch (error) {
            console.error("Erro ao remover anexo:", error);
            handleModalMessage({ isError: true, message: getApiErrorMessage(error, "Erro ao remover anexo.") });
        }
    }

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

    async function handleSaveCourseTags(explicitCourseId?: number) {
        const targetCourseId = explicitCourseId ?? createdCourseId;
        if (!targetCourseId) {
            handleModalMessage({ isError: true, message: "Crie a trilha antes de salvar as tags." });
            return false;
        }

        setSavingCourseTags(true);
        try {
            await setCourseTags(targetCourseId, courseDefaultTagIds);
            const persisted = await listCourseTags(targetCourseId);
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

        if (!["video", "audio"].includes(String(lesson.type).toLowerCase())) {
            handleModalMessage({ isError: true, message: "Apenas aulas de vídeo ou áudio podem ser transcritas." });
            return;
        }

        try {
            setTranscribingLessonId(lesson.id);
            setTranscriptionLoadingOpen(true);
            const response = await transcribeLesson(lesson.id);
            const chars = Number(response?.data?.chars || 0);
            const transcript = String(response?.data?.transcript || "").trim();
            const preview = String(response?.data?.preview || "").trim();
            const nextText = transcript || preview || String(lesson.code || "").trim();

            setTranscriptionReview({
                open: true,
                moduleIndex,
                lessonIndex,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                text: nextText,
            });

            handleModalMessage({
                isError: false,
                message: chars > 0
                    ? `Transcrição concluída (${chars} caracteres). Revise e aprove para salvar.`
                    : "Transcrição concluída. Revise e aprove para salvar."
            });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            handleModalMessage({
                isError: true,
                message: apiMessage || "Não foi possível transcrever a aula."
            });
        } finally {
            setTranscriptionLoadingOpen(false);
            setTranscribingLessonId(null);
        }
    }

    function openSavedTranscriptionEditor(moduleIndex: number, lessonIndex: number) {
        const lesson = modules[moduleIndex]?.lessons?.[lessonIndex];
        if (!lesson?.id) {
            handleModalMessage({ isError: true, message: "Aula sem ID para edição da transcrição." });
            return;
        }

        const existingText = String(lesson.code || "").trim();
        if (!existingText) {
            handleModalMessage({ isError: true, message: "Essa aula ainda não possui transcrição salva." });
            return;
        }

        setTranscriptionReview({
            open: true,
            moduleIndex,
            lessonIndex,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            text: existingText,
        });
    }

    function closeTranscriptionReview() {
        if (savingTranscriptionReview) return;
        setTranscriptionReview({
            open: false,
            moduleIndex: null,
            lessonIndex: null,
            lessonId: null,
            lessonTitle: "",
            text: "",
        });
    }

    async function approveTranscriptionReview() {
        if (!transcriptionReview.lessonId || transcriptionReview.moduleIndex == null || transcriptionReview.lessonIndex == null) {
            return;
        }

        const approvedText = String(transcriptionReview.text || "").trim();
        if (!approvedText) {
            handleModalMessage({ isError: true, message: "A transcrição não pode ficar vazia." });
            return;
        }

        setSavingTranscriptionReview(true);
        try {
            await updateLessonCode(transcriptionReview.lessonId, approvedText);

            setModules(prev =>
                prev.map((m, mi) =>
                    mi !== transcriptionReview.moduleIndex
                        ? m
                        : {
                            ...m,
                            lessons: (m.lessons ?? []).map((l, li) =>
                                li === transcriptionReview.lessonIndex ? { ...l, code: approvedText } : l
                            ),
                        }
                )
            );

            closeTranscriptionReview();
            handleModalMessage({ isError: false, message: "Transcrição aprovada e salva na aula." });
        } catch (error: any) {
            const apiMessage = error?.response?.data?.message;
            handleModalMessage({ isError: true, message: apiMessage || "Erro ao salvar transcrição da aula." });
        } finally {
            setSavingTranscriptionReview(false);
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


    // Função para criar curso
    async function handleCreateCourse() {
        if (!selectedSegments.length) {
            handleModalMessage({ isError: true, message: "Selecione ao menos um segmento escolar." });
            return;
        }
        if (!newCourseData.series.length) {
            handleModalMessage({ isError: true, message: "Selecione ao menos uma série." });
            return;
        }

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
                if (courseDefaultTagIds.length > 0) {
                    await handleSaveCourseTags(courseId);
                }
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
                const uploadedFileKey = resolveUploadedFileKey(fileMeta);

                // 3️⃣ Cria registro na tabela files com lessonId correto
                await createFile({
                  lessonId,
                  courseId: createdCourseId!,
                  fileKey: uploadedFileKey,
                  fileType: newLessonData.type,
                  mimeType: newLessonData.file.type,
                  size: newLessonData.file.size,
                });

                // 4️⃣ Atualiza a aula via PUT em /lessons/:id para setar extUrl = id do CDN
                await updateLessonExtUrl(lessonId, uploadedFileKey);
                extUrlFromFileId = uploadedFileKey;
            }

            const uploadedAttachments = await uploadAttachmentsForLesson(lessonId, newLessonData.attachmentFiles ?? []);

            // Atualiza o estado dos módulos, usando extUrl = id do CDN se houver arquivo
            setModules(prev =>
                prev.map((m, i) =>
                    i === idx
                        ? { ...m, lessons: [...(m.lessons ?? []), { ...lessonPayload, id: lessonId, extUrl: extUrlFromFileId, attachments: uploadedAttachments }] }
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
                attachmentFiles: [],
                mimeType: undefined,
                size: undefined,
                fileName: undefined,
            });
            setShowLessonFormForModuleIndex(null);

        } catch (error) {
            console.error("Erro ao criar aula:", error);
            handleModalMessage({ isError: true, message: getApiErrorMessage(error, "Erro ao criar a aula") });
        } finally {
            setLessonFileUploading(false);
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container course-builder-page">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="form-container course-builder-container">
                        <div className="title-wrapper course-builder-header">
                            <b>Cadastrar novo conteúdo</b>
                            <button className="course-builder-back-button" onClick={() => {window.history.back()}}>Voltar</button>
                        </div>
                        <div className="form-wrapper course-builder-section">
                            <div className="title-wrapper course-builder-section-header">
                                <b>Informações gerais do conteúdo</b>
                            </div>
                            <div className="form-grid">
                                <div className="input-wrapper">
                                    <label htmlFor="title">Nome do conteúdo:*</label>
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
                                    <label htmlFor="subtitle">Subtítulo do conteúdo:</label>
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
                                    <label htmlFor="courseCategory">Categoria:*</label>
                                    <select
                                        id="courseCategory"
                                        name="courseCategory"
                                        value={newCourseData.category}
                                        onChange={e =>
                                            setNewCoursedata(prev => ({
                                                ...prev!,
                                                category: e.target.value as ICourseData["category"],
                                            }))
                                        }
                                    >
                                        {COURSE_CATEGORY_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="cover">Capa do conteúdo:*</label>
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
                                    <label htmlFor="courseSegments">Segmento Escolar:*</label>
                                    <div className="custom-multiselect" ref={segmentsRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsSegmentsOpen(prev => !prev)}
                                        >
                                            {selectedSegments.length
                                                ? `${selectedSegments.length} segmento(s) selecionado(s)`
                                                : "Selecionar segmentos"}
                                        </button>

                                        {isSegmentsOpen && (
                                            <div className="multiselect-popup">
                                                {segments.map(segment => (
                                                    <label key={segment.value} className="multiselect-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSegments.includes(segment.value)}
                                                            onChange={() => toggleSegmentSelection(segment.value)}
                                                        />
                                                        <span>{segment.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="input-wrapper">
                                    <label htmlFor="courseSeries">Séries:*</label>
                                    <div className="custom-multiselect" ref={gradesRef}>
                                        <button
                                            type="button"
                                            className="multiselect-trigger"
                                            onClick={() => setIsGradesOpen(prev => !prev)}
                                            disabled={!selectedSegments.length}
                                        >
                                            {!selectedSegments.length
                                                ? "Selecione segmento(s)"
                                                : newCourseData.series.length
                                                    ? `${newCourseData.series.length} série(s) selecionada(s)`
                                                    : "Selecionar séries"}
                                        </button>

                                        {isGradesOpen && selectedSegments.length > 0 && (
                                            <div className="multiselect-popup">
                                                {availableGrades.map(grade => (
                                                    <label key={grade.value} className="multiselect-option">
                                                        <input
                                                            type="checkbox"
                                                            checked={newCourseData.series.includes(grade.value)}
                                                            onChange={() => toggleGradeSelection(grade.value)}
                                                        />
                                                        <span>{grade.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="button-wrapper course-builder-primary-actions">
                                <button
                                    className="submit-button"
                                    disabled={createdCourseId != null}
                                    onClick={handleCreateCourse}
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                        <div className="form-wrapper course-builder-section">
                            <div className="title-wrapper course-builder-section-header">
                                <b>Tags do conteúdo</b>
                                <div className="course-inline-actions">
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
                                    <div className="course-tags-list">
                                        {availableLessonTags.map(tag => {
                                            const tagId = Number(tag.id);
                                            const checked = courseDefaultTagIds.includes(tagId);
                                            return (
                                                <label
                                                    key={`default-course-tag-${tagId}`}
                                                    className={`course-tag-pill${checked ? " is-selected" : ""}`}
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
                                                    <span className="course-tag-name" style={{ background: tag.categoryColor || "#3696D3" }}>
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
                        {/* Listagem de módulos: visível assim que a trilha é criado */}
                        {createdCourseId != null && (
                            <div className="form-wrapper course-builder-section">
                                <div className="title-wrapper course-builder-section-header">
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
                                                            className="action-button"
                                                            onClick={() => openEditModuleModal(index)}
                                                        >
                                                            Editar módulo
                                                        </button>
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
                                                                <div className="lesson-card-header">
                                                                    <span className="lesson-type-badge">
                                                                        {lesson.type}
                                                                    </span>
                                                                </div>
                                                                <div className="lesson-card-body">
                                                                    <strong>{lesson.title}</strong>
                                                                    {lesson.subTitle && <p>{lesson.subTitle}</p>}
                                                                    <div style={{ marginTop: 8 }}>
                                                                        <small>{(lesson.attachments ?? []).length} anexo(s)</small>
                                                                    </div>
                                                                    {(lesson.attachments ?? []).length > 0 && (
                                                                        <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                                                                            {(lesson.attachments ?? []).map((attachment) => (
                                                                                <div key={attachment.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                                                                                    <small style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                                        {attachment.title || attachment.fileKey}
                                                                                    </small>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="action-button remove-lesson"
                                                                                        onClick={() => handleDeleteAttachment(index, lessonIndex, attachment.id)}
                                                                                        title="Remover anexo"
                                                                                        aria-label="Remover anexo"
                                                                                    >
                                                                                        🗑️
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {lesson.id && (
                                                                        <div style={{ marginTop: 10 }}>
                                                                            <input
                                                                                type="file"
                                                                                multiple
                                                                                id={`new-lesson-attachments-${index}-${lessonIndex}`}
                                                                                style={{ display: "none" }}
                                                                                onChange={(e) => {
                                                                                    void handleUploadAttachments(index, lessonIndex, e.target.files);
                                                                                    e.currentTarget.value = "";
                                                                                }}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="secondary-button"
                                                                                disabled={attachmentUploadingKey === `${index}-${lessonIndex}`}
                                                                                onClick={() => document.getElementById(`new-lesson-attachments-${index}-${lessonIndex}`)?.click()}
                                                                            >
                                                                                {attachmentUploadingKey === `${index}-${lessonIndex}` ? "Enviando..." : "Adicionar anexos"}
                                                                            </button>
                                                                        </div>
                                                                    )}
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
                                                                    <button
                                                                        type="button"
                                                                        className="secondary-button lesson-icon-button"
                                                                        onClick={() => openEditLessonModal(index, lessonIndex)}
                                                                        title="Editar aula"
                                                                        aria-label="Editar aula"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    {["video", "audio"].includes(String(lesson.type).toLowerCase()) && (
                                                                        (() => {
                                                                            const isTranscribing = transcribingLessonId === lesson.id;
                                                                            const hasTranscript = Boolean(String(lesson.code || "").trim());
                                                                            const title = isTranscribing
                                                                                ? "Transcrevendo mídia"
                                                                                : hasTranscript
                                                                                    ? "Editar transcrição"
                                                                                    : "Transcrever mídia";
                                                                            return (
                                                                        <button
                                                                            type="button"
                                                                            className="action-button add-lesson"
                                                                            disabled={isTranscribing}
                                                                            onClick={() =>
                                                                                hasTranscript
                                                                                    ? openSavedTranscriptionEditor(index, lessonIndex)
                                                                                    : handleTranscribeLesson(index, lessonIndex)
                                                                            }
                                                                            title={title}
                                                                            aria-label={title}
                                                                        >
                                                                            {isTranscribing ? "⏳" : hasTranscript ? "✏️" : "📝"}
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

                        {transcriptionLoadingOpen && (
                            <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Transcrevendo aula">
                                <div className="modal-content" style={{ maxWidth: 420, textAlign: "center" }}>
                                    <div className="title-wrapper">
                                        <b>Transcrevendo aula...</b>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <div className="transcription-loader" aria-hidden="true" />
                                    </div>
                                    <span style={{ fontFamily: "SF UI Display Medium", color: "#4b5563" }}>
                                        Aguarde. Isso pode levar alguns minutos.
                                    </span>
                                </div>
                            </div>
                        )}

                        {transcriptionReview.open && (
                            <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Revisar transcrição da aula">
                                <div className="modal-content" style={{ maxWidth: 900 }}>
                                    <div className="title-wrapper">
                                        <b>Revisar transcrição: {transcriptionReview.lessonTitle}</b>
                                    </div>
                                    <div className="input-wrapper">
                                        <label htmlFor="transcriptionReviewNew">Edite o texto antes de aprovar:</label>
                                        <textarea
                                            id="transcriptionReviewNew"
                                            rows={14}
                                            value={transcriptionReview.text}
                                            onChange={e =>
                                                setTranscriptionReview(prev => ({
                                                    ...prev,
                                                    text: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="button-wrapper">
                                        <button
                                            className="secondary-button"
                                            type="button"
                                            disabled={savingTranscriptionReview}
                                            onClick={closeTranscriptionReview}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="submit-button"
                                            type="button"
                                            disabled={savingTranscriptionReview}
                                            onClick={approveTranscriptionReview}
                                        >
                                            {savingTranscriptionReview ? "Salvando..." : "Aprovar e salvar"}
                                        </button>
                                    </div>
                                </div>
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
                                            <label htmlFor="newTagCategoryName">Nome:</label>
                                            <input
                                                type="text"
                                                id="newTagCategoryName"
                                                value={newTagCategoryName}
                                                placeholder="Ex.: Competências"
                                                onChange={e => setNewTagCategoryName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="newTagCategoryColor">Cor:</label>
                                            <input
                                                type="color"
                                                id="newTagCategoryColor"
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
                                            <label htmlFor="newTagName">Nome:</label>
                                            <input
                                                type="text"
                                                id="newTagName"
                                                value={newTagName}
                                                placeholder="Ex.: Leitura"
                                                onChange={e => setNewTagName(e.target.value)}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="newTagCategoryId">Categoria:</label>
                                            <select
                                                id="newTagCategoryId"
                                                value={newTagCategoryId || ""}
                                                onChange={e => setNewTagCategoryId(Number(e.target.value))}
                                            >
                                                <option value="">Selecione</option>
                                                {tagCategories.map(category => (
                                                    <option key={`new-tag-category-${category.id}`} value={category.id}>
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

                        {editModuleIndex !== null && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b>Editar módulo</b>
                                    </div>
                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="newEditModuleTitle">Nome do módulo:*</label>
                                            <input
                                                type="text"
                                                id="newEditModuleTitle"
                                                value={editModuleData.title}
                                                onChange={e => setEditModuleData(prev => ({ ...prev, title: e.target.value }))}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="newEditModuleDescription">Descrição do módulo:</label>
                                            <input
                                                type="text"
                                                id="newEditModuleDescription"
                                                value={editModuleData.description}
                                                onChange={e => setEditModuleData(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="newEditModuleOrder">Ordem:*</label>
                                            <input
                                                type="number"
                                                id="newEditModuleOrder"
                                                value={editModuleData.order}
                                                onChange={e => setEditModuleData(prev => ({ ...prev, order: Number(e.target.value) || 1 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="button-wrapper">
                                        <button className="submit-button" type="button" onClick={handleSaveLocalModuleDetails}>
                                            Salvar alterações
                                        </button>
                                        <button className="secondary-button" type="button" onClick={() => setEditModuleIndex(null)}>
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
                                                        type: e.target.value as "video" | "audio" | "pdf" | "attachment",
                                                        extUrl: undefined,
                                                        code: undefined,
                                                        cover: undefined,
                                                        isActive: 1,
                                                    }))
                                                }
                                            >
                                                <option value="video">Vídeo</option>
                                                <option value="audio">Áudio</option>
                                                <option value="pdf">PDF</option>
                                                <option value="attachment">Anexo</option>
                                            </select>
                                        </div>
                                        {(newLessonData.type === "pdf" || newLessonData.type === "attachment" || newLessonData.type === "video" || newLessonData.type === "audio") && (
                                            <div className="input-wrapper">
                                                <label htmlFor="lessonFile">
                                                    Arquivo (
                                                    {newLessonData.type === "pdf"
                                                        ? "PDF"
                                                        : newLessonData.type === "audio"
                                                        ? "Áudio"
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
                                                            : newLessonData.type === "audio"
                                                            ? "audio/*"
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
                                        <div className="input-wrapper">
                                            <label htmlFor="lessonAttachments">Anexos da aula (opcional):</label>
                                            <input
                                                type="file"
                                                id="lessonAttachments"
                                                multiple
                                                disabled={lessonFileUploading}
                                                onChange={e => {
                                                    setNewLessonData(prev => ({
                                                        ...prev,
                                                        attachmentFiles: Array.from(e.target.files ?? []),
                                                    }));
                                                }}
                                            />
                                            {!!newLessonData.attachmentFiles?.length && (
                                                <div style={{ marginTop: 4 }}>
                                                    {newLessonData.attachmentFiles.length} anexo(s) selecionado(s)
                                                </div>
                                            )}
                                        </div>
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
                attachmentFiles: [],
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

                        {editLessonTarget !== null && (
                            <div className="modal-overlay modal-overlay-lesson" role="dialog" aria-modal="true" aria-labelledby="new-edit-lesson-modal-title">
                                <div className="modal-content">
                                    <div className="title-wrapper">
                                        <b id="new-edit-lesson-modal-title">Editar aula</b>
                                    </div>
                                    <div className="form-grid">
                                        <div className="input-wrapper">
                                            <label htmlFor="newEditLessonTitle">Título da aula:*</label>
                                            <input
                                                type="text"
                                                id="newEditLessonTitle"
                                                value={editLessonData.title}
                                                onChange={e => setEditLessonData(prev => ({ ...prev, title: e.target.value }))}
                                            />
                                        </div>
                                        <div className="input-wrapper">
                                            <label htmlFor="newEditLessonSubTitle">Subtítulo (opcional):</label>
                                            <input
                                                type="text"
                                                id="newEditLessonSubTitle"
                                                value={editLessonData.subTitle}
                                                onChange={e => setEditLessonData(prev => ({ ...prev, subTitle: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="button-wrapper">
                                        <button className="submit-button" type="button" onClick={handleSaveLocalLessonDetails}>
                                            Salvar alterações
                                        </button>
                                        <button className="secondary-button" type="button" onClick={() => setEditLessonTarget(null)}>
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

export default NewCoursePage
