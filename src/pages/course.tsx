import React, { useState } from "react";
import '../lib/pdf';
import { useParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { getCourseWithProgress } from "../controllers/course/getCourseWithProgress.controller";
import { getCourseModules } from "../controllers/course/getCourseModules.controller";
import { getModuleLessons } from "../controllers/course/getModuleLessons.controller";
import { getLession } from "../controllers/course/getLesson.controller";
import { updateProgress } from "../controllers/course/updateProgress.controller";
import { listLessonComments } from "../controllers/course/listLessonComments.controller";
import { createComment } from "../controllers/course/createComment.controller";
import { getMyRate } from "../controllers/course/getMyRate.controller";
import { rateLesson } from "../controllers/course/rateLesson.controller";
import { updatePlayback } from "../controllers/user/updatePlayback.controller";
import { getPlayback } from "../controllers/user/getPlayback.controller";
import { globalSearch } from "../controllers/dash/globalSearch.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { getCookies } from "../controllers/misc/cookies.controller";

import AsideMenu from "../components/asideMenu";
import Footer from "../components/footer";

import alunoIcon from "../img/dash/aluno-icon.svg";

import 'react-circular-progressbar/dist/styles.css';
import "../style/course.css";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TCourseData = {
    id: number,
    slug: string,
    title: string,
    cover: string,
    subTitle: string,
    createdAt: string,
    updatedAt: string,
    progressPercentage: string
}

type TCourseModule = {
    id: number,
    courseId: number,
    title: string,
    description: string,
    order: number,
    lessons: Array<TLesson>,    
    progressPercentage: string,
    createdAt: string,
    updatedAt: string
}

type TLesson = {
    id: number,
    slug: string,
    title: string,
    subTitle: string,
    cover: string,
    type: string,
    code: string,
    extUrl: string,
    moduleId: number,
    isActive: boolean,
    allowDownload?: boolean,
    createdAt: string,
    updatedAt: string
}

type TComment = {
    id: number,
    creatorId: number,
    creatorName: string,
    lessonId: number,
    text: string,
    createdAt: string,
    updatedAt: string
}

type TSearchCourse = {
    id: number,
    title: string,
    sub_title?: string,
    slug: string
}

type TSeachModule = {
    id: number,
    title: string,
    description?: string,
    course_id: number,
    course_title: string,
    course_slug: string
}

type TSearchLesson = {
    id: number,
    title: string,
    sub_title?: string,
    slug: string,
    module_id: number,
    module_title: string,
    course_id: number,
    course_title: string,
    course_slug: string
}

type TSearchResult = {
    courses: TSearchCourse[],
    modules: TSeachModule[],
    lessons: TSearchLesson[]
}

function Course() {
    const initializedRef = React.useRef(false)
    const [pendingSeek, setPendingSeek] = React.useState<number | null>(null)
    const { courseSlug, lessonId } = useParams();
    const profilePic = localStorage.getItem("profilePic") || alunoIcon;
    const [courseData, setCourseData] = useState<TCourseData | null>(null);
    const [courseModules, setCourseModules] = useState([] as Array<TCourseModule>)
    const [lessionData, setLessionData] = useState<TLesson | null>(null)
    const [lessonComments, setLessonComments] = useState([] as Array<TComment>)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const renderTaskRef = React.useRef<any>(null);
    const ocrWorkerRef = React.useRef<any>(null);
    const ocrRequestIdRef = React.useRef(0);
    const [search, setSearch] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<TSearchResult>()
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null)

    React.useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        fetchOverviewData();
    }, [])

    type PlaybackLast = {
        type: "video" | "pdf"
        lessonId: number
        position: number
        duration: number
    }

    type PlaybackMemory = {
        last: PlaybackLast
        history: any[]
    }

    const [videoSrc, setVideoSrc] = React.useState<string>();
    const [playbackMemory, setPlaybackMemory] = React.useState<PlaybackMemory | null>(null)
    const [numPages, setNumPages] = React.useState(0);
    const [pageNumber, setPageNumber] = React.useState(1);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [videoProgress, setVideoProgress] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [isPdfFullscreen, setIsPdfFullscreen] = React.useState(false);
    const [lessionRate, setLessionRate] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [isError, setIsError] = React.useState(false);
    const [modalErrorOpen, setModalErrorOpen] = React.useState(false);
    const [message, setMessage] = React.useState("");
    const [pdfAccessibleText, setPdfAccessibleText] = React.useState("");
    const [isPdfOcrRunning, setIsPdfOcrRunning] = React.useState(false);
    const [pdfTextSource, setPdfTextSource] = React.useState<"pdfjs" | "pdfjs-cleaned" | "ocr" | "none">("none");

    function coerceBoolean(value: any): boolean | undefined {
        if (value === true || value === "true" || value === 1 || value === "1") return true;
        if (value === false || value === "false" || value === 0 || value === "0") return false;
        return undefined;
    }

    function resolveAllowDownload(lessonLike: any): boolean {
        const candidates = [
            lessonLike?.allowDownload,
            lessonLike?.downloadAllowed,
            lessonLike?.isDownloadAllowed,
            lessonLike?.canDownload,
            lessonLike?.isDownloadable,
        ];

        for (const c of candidates) {
            const coerced = coerceBoolean(c);
            if (typeof coerced !== "undefined") return coerced;
        }

        return true;
    }

    function toApiStreamUrl(rawKeyOrUrl: string): string {
        const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
        const cdnBase = (process.env.REACT_APP_CDN_URL || "").replace(/\/+$/, "");
        const value = String(rawKeyOrUrl || "").trim();
        if (!value) return "";

        const cdnPrefix = `${cdnBase}/api/stream/`;
        if (cdnBase && value.startsWith(cdnPrefix)) {
            const fileKey = decodeURIComponent(value.slice(cdnPrefix.length));
            return `${apiBase}/files/stream/${encodeURIComponent(fileKey)}`;
        }

        if (value.startsWith("https://") || value.startsWith("http://")) {
            return value;
        }

        return `${apiBase}/files/stream/${encodeURIComponent(value)}`;
    }

    function buildStreamHeaders(url: string): HeadersInit | undefined {
        const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
        if (apiBase && url.startsWith(`${apiBase}/files/stream/`)) {
            return { Authorization: `Bearer ${getCookies("authToken")}` };
        }
        return undefined;
    }

    function toCamelCase(str: string) {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    }

    function mapKeysToCamelCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(mapKeysToCamelCase);
        } else if (obj && typeof obj === "object" && obj.constructor === Object) {
            const newObj: any = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    newObj[toCamelCase(key)] = mapKeysToCamelCase(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    }

    function htmlToPlainText(value?: string): string {
        if (!value) return "";
        const temp = document.createElement("div");
        temp.innerHTML = value;
        return (temp.textContent || temp.innerText || "").replace(/\s+/g, " ").trim();
    }

    function toAccessibleSnippet(value?: string, max = 700): string {
        const text = (value || "").replace(/\s+/g, " ").trim();
        if (!text) return "";
        if (text.length <= max) return text;
        return `${text.slice(0, max)}...`;
    }

    function normalizeRandomUppercase(value?: string): string {
        const text = String(value || "");
        if (!text) return "";

        return text.replace(/\b[\p{L}]{3,}\b/gu, (word) => {
            const letters = Array.from(word).filter((char) => /\p{L}/u.test(char));
            if (letters.length < 3) return word;

            const hasUpper = letters.some((char) => char === char.toUpperCase() && char !== char.toLowerCase());
            const hasLower = letters.some((char) => char === char.toLowerCase() && char !== char.toUpperCase());
            if (!hasUpper || !hasLower) return word;

            const transitions = letters.reduce((acc, char, idx) => {
                if (idx === 0) return 0;
                const prev = letters[idx - 1];
                const prevUpper = prev === prev.toUpperCase() && prev !== prev.toLowerCase();
                const currentUpper = char === char.toUpperCase() && char !== char.toLowerCase();
                return acc + (prevUpper !== currentUpper ? 1 : 0);
            }, 0);

            const upperCount = letters.filter((char) => char === char.toUpperCase() && char !== char.toLowerCase()).length;
            const upperRatio = upperCount / letters.length;
            const isLikelyAcronym = word === word.toUpperCase() && letters.length <= 5;

            if (isLikelyAcronym) return word;
            if (transitions >= 2 && upperRatio >= 0.2 && upperRatio <= 0.8) {
                return word.toLowerCase();
            }

            return word;
        });
    }

    function splitAccessibleText(
        value?: string,
        maxChunkLength = 420,
        options?: { normalizeRandomCase?: boolean }
    ): string[] {
        const shouldNormalizeRandomCase = options?.normalizeRandomCase === true;
        const baseText = (value || "").replace(/\s+/g, " ").trim();
        const text = shouldNormalizeRandomCase ? normalizeRandomUppercase(baseText) : baseText;
        if (!text) return [];

        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map((part) => part.trim())
            .filter(Boolean);

        const chunks: string[] = [];
        let current = "";

        for (const sentence of sentences) {
            if (!current) {
                current = sentence;
                continue;
            }

            const next = `${current} ${sentence}`;
            if (next.length <= maxChunkLength) {
                current = next;
                continue;
            }

            chunks.push(current);
            current = sentence;
        }

        if (current) chunks.push(current);
        return chunks;
    }

    function normalizeExtractedPdfText(value?: string): string {
        return String(value || "")
            .replace(/\u00AD/g, "") // soft hyphen
            .replace(/-\s+/g, "") // broken words across line breaks
            .replace(/\s+/g, " ")
            .trim();
    }

    function hasPrivateUseCodepoint(value: string): boolean {
        for (const ch of value) {
            const cp = ch.codePointAt(0) || 0;
            const isBmpPua = cp >= 0xe000 && cp <= 0xf8ff;
            const isSupPua1 = cp >= 0xf0000 && cp <= 0xffffd;
            const isSupPua2 = cp >= 0x100000 && cp <= 0x10fffd;
            if (isBmpPua || isSupPua1 || isSupPua2) return true;
        }
        return false;
    }

    function isCorruptedToken(token: string): boolean {
        if (!token) return false;
        if (/[�□■▮█]/.test(token)) return true;
        if (hasPrivateUseCodepoint(token)) return true;
        if (/(?:Ã.|Â.|â.|Ð.|Ñ.|¤|¦)/.test(token)) return true;
        return false;
    }

    function analyzePdfTextQuality(value?: string) {
        const text = normalizeExtractedPdfText(value);
        const total = text.length || 1;
        const letterOrDigitCount = (text.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/g) || []).length;
        const readableRatio = letterOrDigitCount / total;
        const tokens = text.split(/\s+/).filter(Boolean);
        const corruptedTokens = tokens.filter((token) => isCorruptedToken(token)).length;
        const corruptedTokenRatio = corruptedTokens / Math.max(1, tokens.length);

        return {
            text,
            readableRatio,
            tokenCount: tokens.length,
            corruptedTokens,
            corruptedTokenRatio,
        };
    }

    function cleanCorruptedPdfText(value?: string): string {
        const text = normalizeExtractedPdfText(value);
        if (!text) return "";

        const tokens = text.split(/\s+/).filter(Boolean);
        const cleaned = tokens.filter((token) => !isCorruptedToken(token)).join(" ");
        return normalizeExtractedPdfText(cleaned);
    }

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

    // Helper reutilizável para envio de progresso
    const sendProgressSafe = React.useCallback(async (value: number) => {
        if (!lessonId) return;

        await updateProgress(Number(lessonId), Math.min(100, Math.max(0, value)));
    }, [lessonId]);

    React.useEffect(() => {
        function handleFsChange() {
            setIsPdfFullscreen(Boolean(document.fullscreenElement));
        }
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    React.useEffect(() => {
        if (!search.trim()) {
            setSearchResult(undefined);
            return;
        }

        const delay = setTimeout(async () => {
            try {
            setIsSearching(true);
            const result = await globalSearch(search);
            setSearchResult(result);
            } catch (err) {
            console.error(err);
            } finally {
            setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(delay);
    }, [search]);

    React.useEffect(() => {
        return () => {
            const worker = ocrWorkerRef.current;
            if (worker?.terminate) {
                worker.terminate().catch(() => undefined);
            }
            ocrWorkerRef.current = null;
        };
    }, []);

    React.useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    React.useEffect(() => {
        async function findCourse() {
            await getCourseWithProgress(courseSlug as string)
                    .then(async response => {
                        setCourseData(response[0]);

                        const modules = await getCourseModules(response[0].id);

                        const modulesWithLessons = await Promise.all(
                            modules
                                .sort((a: TCourseModule, b: TCourseModule) => a.order - b.order)
                                .map(async (module: TCourseModule) => {
                                const lessonsResp = await getModuleLessons(module.id);
                                const lessonsRaw =
                                    lessonsResp?.success && Array.isArray(lessonsResp.data)
                                        ? lessonsResp.data
                                        : Array.isArray(lessonsResp)
                                          ? lessonsResp
                                          : Array.isArray(lessonsResp?.data)
                                            ? lessonsResp.data
                                            : [];

                                const lessons = lessonsRaw.map((l: any) => {
                                    const camel = mapKeysToCamelCase(l);
                                    return { ...camel, allowDownload: resolveAllowDownload(camel) };
                                });

                                return {
                                    ...module,
                                    lessons
                                };
                            })
                        );

                        setCourseModules(modulesWithLessons);
                    })
        }

        

        findCourse();
    },[])
    
    React.useEffect(() => {
        async function getLessionData() {
            const response = await getLession(Number(lessonId));
            initializedRef.current = false;
            setPendingSeek(null);

            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }

            setCurrentTime(0);
            setProgress(0);
            setDuration(0);

            // Espera o padrão { success, data, message }
            if (response && response.success && response.data) {
                // Mapeia todos os campos para camelCase, incluindo comentários e avaliação se vierem juntos
                const camelData = mapKeysToCamelCase(response.data);
                camelData.allowDownload = resolveAllowDownload(camelData);
                // Se vier comments ou avaliations junto, já garante camelCase
                setLessionData(camelData);
            } else {
                const camelData = mapKeysToCamelCase(response?.data ?? response);
                if (camelData && typeof camelData === "object") {
                    camelData.allowDownload = resolveAllowDownload(camelData);
                    setLessionData(camelData);
                } else {
                    setLessionData(null);
                }
            }
        }

        async function getComments() {
            const response = await listLessonComments(Number(lessonId));
            // Suporta padrão { success, data, message }
            if (response && response.success && Array.isArray(response.data)) {
                setLessonComments(mapKeysToCamelCase(response.data));
            } else if (Array.isArray(response)) {
                // fallback antigo
                setLessonComments(mapKeysToCamelCase(response));
            } else {
                setLessonComments([]);
            }
        }

        async function getRate() {
            const response = await getMyRate(Number(lessonId));
            // Suporta padrão { success, data, message }
            if (response && response.success && response.data) {
                // Permite vir como snake_case ou camelCase
                setLessionRate(response.data.stars ?? response.data.stars);
            } else if (response && typeof response.stars === "number") {
                setLessionRate(response.stars);
            } else {
                setLessionRate(0);
            }   
        }

        if (lessonId) {
            getLessionData();
            getComments();
            getRate();
        }
    }, [lessonId])

    React.useEffect(() => {
        if (!courseData || !lessionData?.id) return;

        localStorage.setItem(
            "helpdesk:lastLessonContext",
            JSON.stringify({
                route: window.location.pathname,
                courseId: Number(courseData.id) || undefined,
                courseSlug: String(courseData.slug || ""),
                courseTitle: String(courseData.title || ""),
                lessonId: Number(lessionData.id) || undefined,
                lessonTitle: String(lessionData.title || ""),
                savedAt: new Date().toISOString(),
            })
        );
    }, [courseData, lessionData?.id, lessionData?.title]);

    React.useEffect(() => {
        if (!playbackMemory) return
        if (!lessionData) return

        // Try last first, then scan history for a match.
        // Use 'position' when coming from playbackMemory.last, but use 'endAt' when coming from playbackMemory.history.
        let seekPosition: number | undefined

        if (playbackMemory.last && Number(playbackMemory.last.lessonId) === Number(lessionData.id)) {
            seekPosition = playbackMemory.last.position
        } else if (Array.isArray(playbackMemory.history)) {
            const hist = playbackMemory.history.find((h: any) => Number(h.lessonId) === Number(lessionData.id))
            if (hist && typeof hist.endAt !== "undefined") {
                seekPosition = hist.endAt
            } else if (hist && typeof hist.position !== "undefined") {
                // fallback to position if endAt is not available
                seekPosition = hist.position
            }
        }

        if (typeof seekPosition === "undefined") return

        if (lessionData.type === "video") {
            setPendingSeek(seekPosition)
        }
    }, [playbackMemory, lessionData?.id])

    React.useEffect(() => {
        if (!playbackMemory) return
        if (!lessionData) return
        if (lessionData.type !== "pdf") return
        if (!numPages) return

        // Try last first, then scan history for a match.
        // Use 'position' when coming from playbackMemory.last, but use 'endAt' when coming from playbackMemory.history.
        let pageFromPlayback: number | undefined
        let source: "last" | "history" | undefined

        if (playbackMemory.last && Number(playbackMemory.last.lessonId) === Number(lessionData.id)) {
            pageFromPlayback = playbackMemory.last.position
            source = "last"
        } else if (Array.isArray(playbackMemory.history)) {
            const hist = playbackMemory.history.find((h: any) => Number(h.lessonId) === Number(lessionData.id))
            if (hist && typeof hist.endAt !== "undefined") {
                pageFromPlayback = hist.endAt
                source = "history"
            } else if (hist && typeof hist.position !== "undefined") {
                // fallback to position if endAt is not available
                pageFromPlayback = hist.position
                source = "history"
            }
        }

        if (typeof pageFromPlayback === "undefined") return

        const safePage = Math.min(Math.max(pageFromPlayback || 1, 1), numPages)
        if (pageNumber === safePage) return
        setPageNumber(safePage)
    }, [playbackMemory, lessionData?.id, numPages])

    // PDF progress sending effect
    React.useEffect(() => {
        if (lessionData?.type !== "pdf") return;
        if (!numPages) return;

        const percent = (pageNumber / numPages) * 100;

        const id = setTimeout(() => {
            sendProgressSafe(percent);
        }, 500);

        return () => clearTimeout(id);
    }, [pageNumber, numPages]);

    React.useEffect(() => {
        if (lessionData?.type !== "video") return;
        if (!progress) return;

        const id = setTimeout(() => {
            sendProgressSafe(progress);
        }, 5000);

        return () => clearTimeout(id);
    }, [progress]);

    function toggleStepGroup(e: React.MouseEvent<HTMLButtonElement>) {
        const groupId = e.currentTarget.dataset.groupId as string;
        const actualLessionGroup = document.getElementById(groupId);        

        if (actualLessionGroup) {
            actualLessionGroup.classList.toggle("active");
            e.currentTarget.classList.toggle("active");
        }
    }

    const toggleFullscreen = () => {
        const elem = document.querySelector('.pdf-page-wrapper');

        if (!document.fullscreenElement) {
            elem?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    async function setRatedStar(star: number) {
        await rateLesson(Number(lessonId), star);
        setLessionRate(star);
    }

    const formatDate = (date: string) => {
        const d = new Date(date);

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();

        const hora = String(d.getHours() + 3).padStart(2, '0');
        const minuto = String(d.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    };

    React.useEffect(() => {
        // Só processa se for PDF e tiver extUrl definido
        if (!lessionData || lessionData.type !== "pdf" || !lessionData.extUrl) {
            setPdfAccessibleText("");
            setPdfTextSource("none");
            setIsPdfOcrRunning(false);
            return;
        }

        let active = true;

        const renderPdf = async () => {
            const requestId = ++ocrRequestIdRef.current;

            // Cancela render anterior
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {}
            }

            const pdfUrl = toApiStreamUrl(lessionData.extUrl);

            const pdf = await pdfjsLib.getDocument({
                url: pdfUrl,
                httpHeaders: buildStreamHeaders(pdfUrl)
            }).promise;
            if (!active) return;

            setNumPages(pdf.numPages);

            const page = await pdf.getPage(pageNumber);
            if (!active) return;

            const textContent = await page.getTextContent();
            if (!active) return;
            const extractedText = textContent.items
                .map((item: any) => ("str" in item ? item.str : ""))
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
            const normalizedExtractedText = normalizeExtractedPdfText(extractedText);

            const viewport = page.getViewport({ scale: isPdfFullscreen ? 1.2 : 1 });
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext("2d")!;
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const task = page.render({ canvasContext: context, viewport, canvas });
            renderTaskRef.current = task;

            try {
                await task.promise;
            } catch (err: any) {
                if (err?.name !== "RenderingCancelledException") {
                    console.error(err);
                }
                return;
            }

            if (!active || requestId !== ocrRequestIdRef.current) return;

            const quality = analyzePdfTextQuality(normalizedExtractedText);
            const cleanedExtractedText = cleanCorruptedPdfText(normalizedExtractedText);

            if (quality.corruptedTokens === 0 && quality.readableRatio >= 0.5) {
                setPdfAccessibleText(normalizedExtractedText);
                setPdfTextSource("pdfjs");
                setIsPdfOcrRunning(false);
                return;
            }

            // For low/medium corruption, keep PDF native order and drop broken tokens.
            const cleanedLooksUsable =
                cleanedExtractedText.length >= 80 &&
                cleanedExtractedText.length >= normalizedExtractedText.length * 0.55 &&
                quality.corruptedTokenRatio <= 0.18;

            if (cleanedLooksUsable) {
                setPdfAccessibleText(cleanedExtractedText);
                setPdfTextSource("pdfjs-cleaned");
                setIsPdfOcrRunning(false);
                return;
            }

            setIsPdfOcrRunning(true);
            try {
                const { createWorker } = await import("tesseract.js");
                let worker = ocrWorkerRef.current;

                if (!worker) {
                    worker = await createWorker("por+eng");
                    ocrWorkerRef.current = worker;
                }

                const { data } = await worker.recognize(canvas);
                if (!active || requestId !== ocrRequestIdRef.current) return;

                const ocrText = normalizeExtractedPdfText(String(data?.text || ""));
                if (ocrText) {
                    setPdfAccessibleText(ocrText);
                    setPdfTextSource("ocr");
                } else {
                    setPdfAccessibleText(normalizedExtractedText);
                    setPdfTextSource("pdfjs");
                }
            } catch (error) {
                console.error("OCR fallback failed:", error);
                if (!active || requestId !== ocrRequestIdRef.current) return;
                setPdfAccessibleText(normalizedExtractedText);
                setPdfTextSource("pdfjs");
            } finally {
                if (active && requestId === ocrRequestIdRef.current) {
                    setIsPdfOcrRunning(false);
                }
            }
        };

        renderPdf();

        return () => {
            active = false;
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch {}
            }
            setIsPdfOcrRunning(false);
        };
    }, [lessionData, pageNumber, isPdfFullscreen]);

    async function sendComment(event: React.FormEvent) {
        event.preventDefault();

        if (!lessonId) return;

        const input = document.getElementById("commentEl") as HTMLInputElement;
        const comment = input.value.trim();

        if (!comment) return;

        await createComment(Number(lessonId), comment);

        // Limpa o campo
        input.value = "";

        // Atualiza lista de comentários
        const updatedComments = await listLessonComments(Number(lessonId));
        setLessonComments(updatedComments);
    }

    React.useEffect(() => {
        if (!lessonId) return;
        if (lessionData?.type !== "video") return;
        if (!videoRef.current) return;

        const id = setTimeout(() => {
            updatePlayback({
                courseId: Number(courseData?.id),
                lessonId: Number(lessonId),
                type: "video",
                position: videoRef.current!.currentTime,
                duration: videoRef.current!.duration
            });
        }, 5000);

        return () => clearTimeout(id);
    }, [currentTime]);

    React.useEffect(() => {
        if (!lessonId) return;
        if (lessionData?.type !== "pdf") return;
        if (!numPages) return;

        const id = setTimeout(() => {
            updatePlayback({
                courseId: Number(courseData?.id),
                lessonId: Number(lessonId),
                type: "pdf",
                position: pageNumber,
                duration: numPages
            });
        }, 5000);

        return () => clearTimeout(id);
    }, [pageNumber]);

    React.useEffect(() => {
        if (!courseData?.id) return

        async function loadPlayback() {
            const res = await getPlayback(Number(courseData?.id))

            if (
                res?.success &&
                res.data?.last &&
                Number(res.data.last.lessonId) > 0
            ) {
                setPlaybackMemory(res.data)
            } else {
                setPlaybackMemory(null)
            }
        }

        loadPlayback()
    }, [courseData?.id])

    React.useEffect(() => {
        if (pendingSeek === null) return
        if (!videoRef.current) return
        if (initializedRef.current) return

        const video = videoRef.current

        const applySeek = () => {
            if (initializedRef.current) return
            video.currentTime = pendingSeek
            initializedRef.current = true
            setPendingSeek(null)
        }

        // 🚑 Se os eventos já passaram, aplica direto
        if (video.readyState >= 1) {
            if (pendingSeek > video.duration && video.duration > 0) {
                setPendingSeek(video.duration - 0.5)
                return
            }

            applySeek()
            return
        }

        video.addEventListener("loadedmetadata", applySeek)
        video.addEventListener("canplay", applySeek)

        return () => {
            video.removeEventListener("loadedmetadata", applySeek)
            video.removeEventListener("canplay", applySeek)
        }
    }, [pendingSeek, lessionData?.id])

    async function forceDownload(url: string, filename?: string, allowDownload?: boolean) {
        try {
            if (allowDownload === false) {
                handleModalMessage({ isError: true, message: "Download desativado para este conteúdo" });
                return;
            }

            let downloadUrl = toApiStreamUrl(url);
            let headers: HeadersInit | undefined = buildStreamHeaders(downloadUrl);

            const response = await fetch(downloadUrl, { headers });

            if (!response.ok) {
                throw new Error("Erro ao baixar anexo");
            }

            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = blobUrl;
            link.download = filename || "download";

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Erro no download do anexo:", err);
            handleModalMessage({ isError: true, message: "Não foi possível baixar o anexo" });
        }
    }

    React.useEffect(() => {
        async function getVideo() {
            if (!lessionData?.extUrl) return;

            const streamUrl = toApiStreamUrl(lessionData.extUrl);
            const res = await fetch(streamUrl, {
                headers: buildStreamHeaders(streamUrl)
            });

            const blob = await res.blob();
            setVideoSrc(URL.createObjectURL(blob));
        }
        getVideo();
    }, [lessionData?.extUrl]);

    return (
        <React.Fragment>
            <div className="course-container">
                <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="course-wrapper">
                    <div className="course-header">
                        <div className="left">
                            <img src={courseData?.cover} className="course-icon" />
                            <div className="course-title">
                                <b>{courseData?.title}</b>
                                <span>{courseData?.subTitle}</span>
                            </div>
                        </div>
                        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                            <CircularProgressbar
                                styles={buildStyles({
                                    pathColor: '#90C040',
                                    textColor: '#000000',
                                    trailColor: '#d7d7da',
                                    backgroundColor: '#3e98c7'
                                })} 
                                value={Number(courseData?.progressPercentage) || 0}
                                text={(courseData?.progressPercentage || 0) + "%"}
                                className="course-progress"/>
                        </div>
                    </div>
                    {
                        lessionData?.id ? 
                            <React.Fragment>
                                <div className="lession-title">
                                    <b>{lessionData.title}</b>
                                </div>
                                
                                {
                                    (lessionData.type === "video") ?
                                        (<div className="lession-media-wrapper active">
                                            <div className="video-player-wrapper">
                                                <video
                                                    ref={videoRef}
                                                    src={videoSrc}
                                                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                                    onTimeUpdate={(e) => {
                                                        const current = e.currentTarget.currentTime
                                                        const total = e.currentTarget.duration || 0

                                                        setCurrentTime(current)

                                                        if (total > 0 && duration === 0) {
                                                            setDuration(total)
                                                        }

                                                        if (total > 0) {
                                                            const percent = (current / total) * 100
                                                            setVideoProgress(percent)
                                                            setProgress(percent)
                                                        }
                                                    }}
                                                    controlsList={lessionData?.allowDownload ? undefined : "nodownload"}
                                                />

                                                <div className="video-controls bar">
                                                    <div className="progress-track">
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={100}
                                                            value={videoProgress}
                                                            onChange={(e) => {
                                                                if (!videoRef.current) return

                                                                const percent = Number(e.target.value)
                                                                const newTime = (percent / 100) * videoRef.current.duration

                                                                videoRef.current.currentTime = newTime
                                                                setVideoProgress(percent)
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="controls-row">
                                                        <div className="left-controls">
                                                            <button className="control-btn" onClick={() => { if (!isPlaying) videoRef.current?.play(); else videoRef.current?.pause(); setIsPlaying(!isPlaying); }}>
                                                                {isPlaying ? "❚❚" : <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 6.33313C14.8333 7.10293 14.8333 9.02744 13.5 9.79724L3 15.8594C1.66667 16.6292 0 15.667 0 14.1274V2.00301C0 0.463408 1.66667 -0.498843 3 0.270957L13.5 6.33313Z" fill="white"/></svg>}
                                                            </button>

                                                            <button className="control-btn">
                                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M11 17.5V15.45C12.5 15.0167 13.7083 14.1833 14.625 12.95C15.5417 11.7167 16 10.3167 16 8.75C16 7.18333 15.5417 5.78333 14.625 4.55C13.7083 3.31667 12.5 2.48333 11 2.05V0C13.0667 0.466667 14.75 1.5125 16.05 3.1375C17.35 4.7625 18 6.63333 18 8.75C18 10.8667 17.35 12.7375 16.05 14.3625C14.75 15.9875 13.0667 17.0333 11 17.5ZM0 11.775V5.775H4L9 0.775V16.775L4 11.775H0ZM11 12.775V4.725C11.7833 5.09167 12.3958 5.64167 12.8375 6.375C13.2792 7.10833 13.5 7.90833 13.5 8.775C13.5 9.625 13.2792 10.4125 12.8375 11.1375C12.3958 11.8625 11.7833 12.4083 11 12.775ZM7 5.625L4.85 7.775H2V9.775H4.85L7 11.925V5.625Z" fill="white"/>
                                                                </svg>
                                                            </button>

                                                            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => { const newVolume = Number(e.target.value); setVolume(newVolume); if (videoRef.current) { videoRef.current.volume = newVolume; } }} className="volume-slider" />

                                                            <span className="time-display">
                                                                {String(Math.floor(currentTime / 60)).padStart(2, "0")}:
                                                                {String(Math.floor(currentTime % 60)).padStart(2, "0")}
                                                                {" / "}
                                                                {duration > 0
                                                                    ? `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
                                                                    : "--:--"}
                                                            </span>
                                                        </div>

                                                        <div className="right-controls">
                                                            {lessionData?.allowDownload && lessionData?.extUrl && (
                                                                <button
                                                                    type="button"
                                                                    className="control-btn download-btn"
                                                                    onClick={() => forceDownload(lessionData.extUrl, `${lessionData.title || "video"}.mp4`, lessionData.allowDownload)}
                                                                    title="Baixar vídeo"
                                                                >
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                        <path d="M12 3V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                        <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button className="control-btn" onClick={() => videoRef.current?.requestFullscreen()}>
                                                                ⛶
                                                            </button>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>) : ""
                                }
                                {
                                    (lessionData.type === "pdf") ? (
                                        <div className="lession-document-wrapper active">
                                            <div className="pdf-page-wrapper">
                                            <canvas ref={canvasRef} />

                                            <div className={`pdf-controls ${isPdfFullscreen ? "inside-fs" : ""}`}>
                                                <div className="left">
                                                    <button 
                                                      onClick={async () => {
                                                        setPageNumber(p => {
                                                          const newPage = Math.max(p - 1, 1);
                                                          const newProgress = (newPage / numPages) * 100;
                                                          setProgress(newProgress);
                                                          return newPage;
                                                        });
                                                      }} 
                                                      disabled={pageNumber <= 1}>
                                                        <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M35 17.5C35 7.84 27.16 -3.42697e-07 17.5 -7.64949e-07C7.84 -1.1872e-06 -4.15739e-06 7.84 -4.57965e-06 17.5C-5.0019e-06 27.16 7.83999 35 17.5 35C27.16 35 35 27.16 35 17.5ZM12.8625 16.8875L17.745 12.005C18.305 11.445 19.25 11.83 19.25 12.6175L19.25 22.4C19.25 23.1875 18.305 23.5725 17.7625 23.0125L12.88 18.13C12.53 17.78 12.53 17.22 12.8625 16.8875Z" fill="#323232"/>
                                                        </svg>
                                                    </button>

                                                    <button 
                                                      onClick={async () => {
                                                        setPageNumber(p => {
                                                          const newPage = Math.min(p + 1, numPages);
                                                          const newProgress = (newPage / numPages) * 100;
                                                          setProgress(newProgress);
                                                          return newPage;
                                                        });
                                                      }} 
                                                      disabled={pageNumber >= numPages}>
                                                        <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M2.29485e-06 17.5C1.02809e-06 27.16 7.84 35 17.5 35C27.16 35 35 27.16 35 17.5C35 7.84 27.16 -2.53093e-07 17.5 -1.51985e-06C7.84 -2.78661e-06 3.5616e-06 7.84 2.29485e-06 17.5ZM22.1375 18.1125L17.255 22.995C16.695 23.555 15.75 23.17 15.75 22.3825L15.75 12.6C15.75 11.8125 16.695 11.4275 17.2375 11.9875L22.12 16.87C22.47 17.22 22.47 17.78 22.1375 18.1125Z" fill="#323232"/>
                                                        </svg>

                                                    </button>

                                                    <span>{pageNumber} / {numPages}</span>
                                                </div>

                                                <div className="right">
                                                      {lessionData?.allowDownload && lessionData?.extUrl && (
                                                        <button
                                                            type="button"
                                                            className="download-btn"
                                                            onClick={() => forceDownload(lessionData.extUrl, `${lessionData.title || "arquivo"}.pdf`, lessionData.allowDownload)}
                                                            title="Baixar PDF"
                                                        >
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                <path d="M12 3V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                            </svg>
                                                        </button>
                                                    )}

                                                    <button onClick={toggleFullscreen}>
                                                        <svg width="42" viewBox="0 0 52 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M47.2727 28.6667H52V33.4444H47.2727V28.6667ZM47.2727 19.1111H52V23.8889H47.2727V19.1111ZM52 38.2222H47.2727V43C49.6364 43 52 40.6111 52 38.2222ZM28.3636 0H33.0909V4.77778H28.3636V0ZM47.2727 9.55556H52V14.3333H47.2727V9.55556ZM47.2727 0V4.77778H52C52 2.38889 49.6364 0 47.2727 0ZM0 9.55556H4.72727V14.3333H0V9.55556ZM37.8182 0H42.5455V4.77778H37.8182V0ZM37.8182 38.2222H42.5455V43H37.8182V38.2222ZM4.72727 0C2.36364 0 0 2.38889 0 4.77778H4.72727V0ZM18.9091 0H23.6364V4.77778H18.9091V0ZM9.45455 0H14.1818V4.77778H9.45455V0ZM0 19.1111V38.2222C0 40.85 2.12727 43 4.72727 43H33.0909V23.8889C33.0909 21.2611 30.9636 19.1111 28.3636 19.1111H0ZM6.21636 36.2872L9.73818 31.7244C10.2109 31.1272 11.0855 31.1033 11.5818 31.7006L14.8673 35.69L19.8309 29.24C20.3036 28.6189 21.2491 28.6189 21.6982 29.2639L26.9455 36.335C27.5364 37.1233 26.9691 38.2461 26 38.2461H7.13818C6.16909 38.2222 5.60182 37.0756 6.21636 36.2872Z" fill="#323232"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                            </div>
                                            </div>
                                        </div>
                                    ) : ""
                                }
                                

                                <div className="avaliation-wrapper">
                                    <div className="avaliation-title">
                                        Avalie este conteúdo
                                    </div>

                                    <div className="stars-wrapper">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                className={`star-btn ${star <= lessionRate ? "active" : ""}`}
                                                onClick={() => setRatedStar(star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(lessionData.type === "video" || lessionData.type === "pdf") && (
                                    <div className="media-accessibility-panel" aria-live="polite">
                                        <b>
                                            {lessionData.type === "video"
                                                ? "Texto para tradução em Libras (aula em vídeo)"
                                                : "Texto para tradução em Libras (PDF)"}
                                        </b>
                                        {lessionData.type === "video" ? (
                                            <>
                                                <p>{`Aula em vídeo: ${lessionData.title}.`}</p>
                                                {lessionData.subTitle && <p>{`Subtítulo: ${lessionData.subTitle}.`}</p>}
                                                {(() => {
                                                    const transcriptChunks = splitAccessibleText(htmlToPlainText(lessionData.code));
                                                    if (transcriptChunks.length === 0) {
                                                        return <p>Transcrição textual não disponível para este vídeo.</p>;
                                                    }

                                                    return transcriptChunks.map((chunk, idx) => (
                                                        <p key={`video-transcript-chunk-${idx}`}>
                                                            {chunk}
                                                        </p>
                                                    ));
                                                })()}
                                            </>
                                        ) : (
                                            <>
                                                <p>{`PDF "${lessionData.title}". Página ${pageNumber} de ${numPages || 1}.`}</p>
                                                {isPdfOcrRunning && <p>Detectando texto com OCR para melhorar leitura da página...</p>}
                                                {!isPdfOcrRunning && pdfTextSource === "ocr" && <p>Texto obtido por OCR (fonte diferenciada detectada).</p>}
                                                {!isPdfOcrRunning && pdfTextSource === "pdfjs-cleaned" && <p>Texto obtido do PDF com limpeza automática de caracteres corrompidos.</p>}
                                                {(() => {
                                                    const pdfChunks = splitAccessibleText(pdfAccessibleText, 420, {
                                                        normalizeRandomCase: true,
                                                    });
                                                    if (pdfChunks.length === 0) {
                                                        return <p>Sem texto detectável nesta página.</p>;
                                                    }

                                                    return pdfChunks.map((chunk, idx) => (
                                                        <p key={`pdf-text-chunk-${pageNumber}-${idx}`}>
                                                            {chunk}
                                                        </p>
                                                    ));
                                                })()}
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="comments-wrapper">
                                    <form className="comment-form" onSubmit={sendComment}>
                                        <input type="text" name="comment" id="commentEl" placeholder="Adcione um comentário" />
                                        <button type="submit">Comentar</button>
                                    </form>

                                    <div className="comments-list">
                                        {
                                            lessonComments.map(comment => (
                                                <div className="comment-element">
                                                    <div className="header">
                                                        <b>{comment.creatorName}</b>
                                                        <small>{formatDate(comment.createdAt)}</small>
                                                    </div>
                                                    <span>{comment.text}</span>
                                                    <hr />
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </React.Fragment>

                            : <React.Fragment>
                                <div className="no-content-wrapper">
                                    <b className="middle-title">Escolha uma aula para continuar</b>
                                </div>
                            </React.Fragment>

                        }

                </div>
                <div className="right-container">
                    <div className="profile-container">
                        <div className="search-wrapper">
                            <div className="search-box">
                                <button disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                        <path d="M13.6999 2.34726C10.5702 -0.782421 5.47644 -0.782421 2.34675 2.34726C-0.782251 5.47762 -0.782251 10.5707 2.34675 13.7011C5.13382 16.4875 9.47453 16.786 12.6022 14.6102C12.668 14.9216 12.8186 15.2188 13.0608 15.461L17.6186 20.0188C18.2828 20.6817 19.3561 20.6817 20.0169 20.0188C20.6805 19.3553 20.6805 18.282 20.0169 17.6205L15.4591 13.0613C15.2183 12.8212 14.9204 12.6699 14.609 12.604C16.7862 9.47572 16.4877 5.13569 13.6999 2.34726ZM12.2609 12.2621C9.92435 14.5987 6.12164 14.5987 3.78574 12.2621C1.45052 9.92553 1.45052 6.12351 3.78574 3.78693C6.12164 1.45103 9.92435 1.45103 12.2609 3.78693C14.5975 6.12351 14.5975 9.92553 12.2609 12.2621Z" fill="black"/>
                                    </svg>
                                </button>
                                 <input type="search" className="main-search" id="mainSearchInput" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cursos, módulos ou aulas..."/>

                                {searchResult && (
                                    <div className="global-search-results">
                                        {isSearching && <span>Buscando...</span>}

                                        {searchResult.courses.map(course => (
                                        <a key={`c-${course.id}`} href={`/course/${course.slug}`} className="search-item">
                                            📘 {course.title}
                                        </a>
                                        ))}

                                        {searchResult.modules.map(module => (
                                        <a key={`m-${module.id}`} href={`/course/${module.course_slug}`} className="search-item">
                                            📦 {module.course_title} • {module.title}
                                        </a>
                                        ))}

                                        {searchResult.lessons.map(lesson => (
                                        <a key={`l-${lesson.id}`} href={`/course/${lesson.course_slug}/lesson/${lesson.id}`} className="search-item">
                                            🎬 {lesson.course_title} • {lesson.module_title} • {lesson.title}
                                        </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="profile-wrapper">
                            <button className="profile-button" onClick={() => window.location.pathname = "/profile"}>
                                <div className="profile-photo" style={{ backgroundImage: profilePic ? `url("${profilePic}")` : "none" }}></div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 8 5" fill="none">
                                    <path d="M4.02125 4.02116L6.99829 1.04411C7.17993 0.862473 7.17993 0.567893 6.99829 0.386256C6.81662 0.204581 6.52211 0.204581 6.34044 0.386256L4.15748 2.56921C4.15748 2.56921 3.93782 2.81522 3.69409 2.81006C3.45622 2.80502 3.22716 2.56921 3.22716 2.56921L1.0442 0.38633C0.862523 0.204656 0.568018 0.204656 0.386343 0.38633C0.295581 0.47713 0.250107 0.596212 0.250107 0.715257C0.250107 0.834301 0.295581 0.953347 0.386343 1.04418L3.36339 4.02116C3.54507 4.20283 3.83957 4.20283 4.02125 4.02116Z" fill="black" stroke="black" stroke-width="0.5"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="steps-list">
                        {
                            courseModules.map((module, index) => (
                                <div className="steps-group">
                                    <button className="step-button" data-group-id={`lession-group-${index + 1}`} onClick={toggleStepGroup}>
                                        <div className="left">
                                            <b className="group-number">{module.order}</b>
                                            <div className="text">
                                                <b>{module.title}</b>
                                                <span>{module.lessons?.length ?? 0} conteúdo{((module.lessons?.length ?? 0) > 1) ? "s" : ""}</span>
                                            </div>
                                        </div>
                                        <div className="right">
                                            <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                                                <CircularProgressbar
                                                    styles={buildStyles({
                                                        pathColor: '#90C040',
                                                        textColor: '#000000',
                                                        trailColor: '#d7d7da',
                                                        backgroundColor: '#3e98c7'
                                                    })}
                                                    value={Number(module.progressPercentage)}
                                                    text={`${module.progressPercentage}%`}
                                                    className="course-progress"/>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 8 5" fill="none">
                                                <path d="M4.02125 4.02116L6.99829 1.04411C7.17993 0.862473 7.17993 0.567893 6.99829 0.386256C6.81662 0.204581 6.52211 0.204581 6.34044 0.386256L4.15748 2.56921C4.15748 2.56921 3.93782 2.81522 3.69409 2.81006C3.45622 2.80502 3.22716 2.56921 3.22716 2.56921L1.0442 0.38633C0.862523 0.204656 0.568018 0.204656 0.386343 0.38633C0.295581 0.47713 0.250107 0.596212 0.250107 0.715257C0.250107 0.834301 0.295581 0.953347 0.386343 1.04418L3.36339 4.02116C3.54507 4.20283 3.83957 4.20283 4.02125 4.02116Z" fill="black" stroke="black" stroke-width="0.5"/>
                                            </svg>
                                        </div>
                                    </button>

                                    <div className="lessions-list" id={`lession-group-${index + 1}`}>
                                        {
                                            module.lessons.map(lesson => (
                                                <div className="lession-item">
                                                    <div className="left">
                                                        <img src={lesson.cover} className="lession-img" />
                                                        <b>{lesson.title}</b>
                                                    </div>

                                                    {lesson.type === "attachment" ? (
                                                        (lesson.allowDownload === false ? (
                                                            <button type="button" className="lesson-action-link" disabled>
                                                                Download bloqueado
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => forceDownload(lesson.extUrl, lesson.title, lesson.allowDownload)}
                                                                className="lesson-action-link"
                                                            >
                                                                Baixar
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <a
                                                            href={`/course/${courseSlug}/lesson/${lesson.id}`}
                                                            className="lesson-action-link"
                                                        >
                                                            {lesson.type === "video" ? "Assistir" : "Ler"}
                                                        </a>
                                                    )}
                                                </div>
                                            ))
                                        }
                                    </div>
                            </div>
                            ))
                        }
                    </div>
                </div>
                
            </div>
            <Footer/>
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

export default Course;
