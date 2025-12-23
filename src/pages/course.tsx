import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { getCourseWithProgress } from "../controllers/course/getCourseWithProgress.controller";
import { getCourseModules } from "../controllers/course/getCourseModules.controller";
import { getModuleLessons } from "../controllers/course/getModuleLessons.controller";
import { getLession } from "../controllers/course/getLesson.controller";
import { updateProgress } from "../controllers/course/updateProgress.controller";

import AsideMenu from "../components/asideMenu";
import Footer from "../components/footer";

import notificationIcon from "../img/notification.svg";
import alunoIcon from "../img/dash/aluno-icon.svg";

import 'react-circular-progressbar/dist/styles.css';
import "../style/course.css";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;

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
    createdAt: string,
    updatedAt: string
}

function Course() {
    const { courseSlug, lessonId } = useParams();
    const [courseData, setCourseData] = useState<TCourseData | null>(null);
    const [courseModules, setCourseModules] = useState([] as Array<TCourseModule>)
    const [lessionData, setLessionData] = useState<TLesson | null>(null)

    const [numPages, setNumPages] = React.useState(0);
    const [pageNumber, setPageNumber] = React.useState(1);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [isPdfFullscreen, setIsPdfFullscreen] = React.useState(false);
    const [lessionRate, setLessionRate] = React.useState(0);
    const [volume, setVolume] = React.useState(1);

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
                                const lessons = await getModuleLessons(module.id);

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
            await getLession(Number(lessonId))
                .then(response => {
                    setLessionData(response);
                })
        }

        if (lessonId) {
            getLessionData();
        }
    }, [])

    // (Removido: função sendProgress)
    // Controle de envio automático para VÍDEO (a cada 5s)
    React.useEffect(() => {
        if (lessionData?.type !== "video") return;

        const interval = setInterval(() => {
            sendProgressSafe(progress);
        }, 5000);

        return () => clearInterval(interval);
    }, [progress, lessionData?.type, sendProgressSafe]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

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

    function setRatedStar(star: number) {
        setLessionRate(star)
    }

    return (
        <React.Fragment>
            <div className="course-container">
                <AsideMenu />
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
                                                <video ref={videoRef} src={lessionData.extUrl} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} onTimeUpdate={(e) => { setCurrentTime(e.currentTarget.currentTime); setProgress((e.currentTarget.currentTime / duration) * 100); }} controlsList="nodownload" />

                                                <div className="video-controls bar">
                                                    <div className="progress-track">
                                                        <input type="range" min={0} max={100} value={progress} onChange={(e) => { const newTime = (Number(e.target.value) / 100) * duration; if (videoRef.current) videoRef.current.currentTime = newTime; }} />
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
                                                                {String(Math.floor(duration / 60)).padStart(2, "0")}:
                                                                {String(Math.floor(duration % 60)).padStart(2, "0")}
                                                            </span>
                                                        </div>

                                                        <div className="right-controls">
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
                                    (lessionData.type === "pdf") ?
                                        (<div className="lession-document-wrapper active">
                                            <div className="pdf-page-wrapper">
                                                <Document file={lessionData.extUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={console.error} onSourceError={console.error}>
                                                    <Page pageNumber={pageNumber} scale={isPdfFullscreen ? 1 : 1.2} renderTextLayer={false} renderAnnotationLayer={false}/>
                                                </Document>


                                                <div className={`pdf-controls ${isPdfFullscreen ? "inside-fs" : ""}`}>
                                                    <div className="left">
                                                        <button onClick={() => {
                                                            setPageNumber(p => {
                                                                const newPage = Math.max(p - 1, 1);
                                                                const newProgress = (newPage / numPages) * 100;
                                                                setProgress(newProgress);
                                                                sendProgressSafe(newProgress);
                                                                return newPage;
                                                            });
                                                        }} disabled={pageNumber <= 1}>
                                                            <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M35 17.5C35 7.84 27.16 -3.42697e-07 17.5 -7.64949e-07C7.84 -1.1872e-06 -4.15739e-06 7.84 -4.57965e-06 17.5C-5.0019e-06 27.16 7.83999 35 17.5 35C27.16 35 35 27.16 35 17.5ZM12.8625 16.8875L17.745 12.005C18.305 11.445 19.25 11.83 19.25 12.6175L19.25 22.4C19.25 23.1875 18.305 23.5725 17.7625 23.0125L12.88 18.13C12.53 17.78 12.53 17.22 12.8625 16.8875Z" fill="#323232"/>
                                                            </svg>
                                                        </button>   

                                                        <button onClick={() => {
                                                            setPageNumber(p => {
                                                                const newPage = Math.min(p + 1, numPages);
                                                                const newProgress = (newPage / numPages) * 100;
                                                                setProgress(newProgress);
                                                                sendProgressSafe(newProgress);
                                                                return newPage;
                                                            });
                                                        }} disabled={pageNumber >= numPages}>
                                                            <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M2.29485e-06 17.5C1.02809e-06 27.16 7.84 35 17.5 35C27.16 35 35 27.16 35 17.5C35 7.84 27.16 -2.53093e-07 17.5 -1.51985e-06C7.84 -2.78661e-06 3.5616e-06 7.84 2.29485e-06 17.5ZM22.1375 18.1125L17.255 22.995C16.695 23.555 15.75 23.17 15.75 22.3825L15.75 12.6C15.75 11.8125 16.695 11.4275 17.2375 11.9875L22.12 16.87C22.47 17.22 22.47 17.78 22.1375 18.1125Z" fill="#323232"/>
                                                            </svg>
                                                        </button>

                                                        <div className="page-input-wrapper">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={numPages}
                                                                value={pageNumber}
                                                                onChange={(e) => {
                                                                    const value = Number(e.target.value);
                                                                    if (!isNaN(value)) {
                                                                        setPageNumber(Math.min(Math.max(1, value), numPages));
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        const value = Number((e.target as HTMLInputElement).value);
                                                                        if (!isNaN(value)) {
                                                                            setPageNumber(Math.min(Math.max(1, value), numPages));
                                                                        }
                                                                    }
                                                                }}
                                                                className="page-number-input"
                                                            />
                                                            <span className="total-pages-label">de {numPages}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={toggleFullscreen}>
                                                        <svg height="35" viewBox="0 0 52 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M47.2727 28.6667H52V33.4444H47.2727V28.6667ZM47.2727 19.1111H52V23.8889H47.2727V19.1111ZM52 38.2222H47.2727V43C49.6364 43 52 40.6111 52 38.2222ZM28.3636 0H33.0909V4.77778H28.3636V0ZM47.2727 9.55556H52V14.3333H47.2727V9.55556ZM47.2727 0V4.77778H52C52 2.38889 49.6364 0 47.2727 0ZM0 9.55556H4.72727V14.3333H0V9.55556ZM37.8182 0H42.5455V4.77778H37.8182V0ZM37.8182 38.2222H42.5455V43H37.8182V38.2222ZM4.72727 0C2.36364 0 0 2.38889 0 4.77778H4.72727V0ZM18.9091 0H23.6364V4.77778H18.9091V0ZM9.45455 0H14.1818V4.77778H9.45455V0ZM0 19.1111V38.2222C0 40.85 2.12727 43 4.72727 43H33.0909V23.8889C33.0909 21.2611 30.9636 19.1111 28.3636 19.1111H0ZM6.21636 36.2872L9.73818 31.7244C10.2109 31.1272 11.0855 31.1033 11.5818 31.7006L14.8673 35.69L19.8309 29.24C20.3036 28.6189 21.2491 28.6189 21.6982 29.2639L26.9455 36.335C27.5364 37.1233 26.9691 38.2461 26 38.2461H7.13818C6.16909 38.2222 5.60182 37.0756 6.21636 36.2872Z" fill="#323232"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>) : ""
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

                                <div className="comments-wrapper">
                                    <form className="comment-form" onSubmit={e => e.preventDefault()}>
                                        <input type="text" name="comment" id="commentEl" placeholder="Adcione um comentário" />
                                        <button type="submit">Comentar</button>
                                    </form>
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
                            <button disabled>
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                    <path d="M13.6999 2.34726C10.5702 -0.782421 5.47644 -0.782421 2.34675 2.34726C-0.782251 5.47762 -0.782251 10.5707 2.34675 13.7011C5.13382 16.4875 9.47453 16.786 12.6022 14.6102C12.668 14.9216 12.8186 15.2188 13.0608 15.461L17.6186 20.0188C18.2828 20.6817 19.3561 20.6817 20.0169 20.0188C20.6805 19.3553 20.6805 18.282 20.0169 17.6205L15.4591 13.0613C15.2183 12.8212 14.9204 12.6699 14.609 12.604C16.7862 9.47572 16.4877 5.13569 13.6999 2.34726ZM12.2609 12.2621C9.92435 14.5987 6.12164 14.5987 3.78574 12.2621C1.45052 9.92553 1.45052 6.12351 3.78574 3.78693C6.12164 1.45103 9.92435 1.45103 12.2609 3.78693C14.5975 6.12351 14.5975 9.92553 12.2609 12.2621Z" fill="black"/>
                                </svg>
                            </button>
                            <input type="search" className="main-search" id="mainSearchInput" />
                        </div>
                        <div className="profile-wrapper">
                            <button className="notitications-button">
                                <img src={notificationIcon} alt="" />
                            </button>
                            <button className="profile-button">
                                <img src={alunoIcon} alt="" className="profile-photo" />
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

                                                    <a href={`/course/${courseSlug}/lesson/${lesson.id}`}>
                                                        {(lesson.type === "video") ? "Assistir" : "Ler"}
                                                    </a>
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
        </React.Fragment>
    )
}

export default Course;