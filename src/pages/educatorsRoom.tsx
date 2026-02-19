import React, { useEffect, useState } from "react";
import AsideMenu from "../components/asideMenu";
import PageSelector from "../components/pageSelector";
import Footer from "../components/footer";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { listCourses } from "../controllers/course/listCourses.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { getCookies } from "../controllers/misc/cookies.controller";

import "../style/educatorsRoomPage.css";

type TCourse = {
    id: number,
    slug: string,
    title: string,
    cover: string,
    subTitle: string,
    createdAt: string,
    updatedAt: string,
    progressPercentage: number
}

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TUserCoursePlayback = {
    courseId: number
    playback?: {
        last?: {
            lessonId: number
            position: number
            type: string
            updatedAt: string
        }
    }
}

type TUser = {
    courses: TUserCoursePlayback[]
}

function EducatorsRoom() {
    const [statusFilter, setStatusFilter] = useState("");
    const [orderFilter, setOrderFilter] = useState("");
    const [search, setSearch] = useState("");
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [courses, setCourses] = useState<TCourse[]>([]);
    const userData = getCookies("userData") as unknown as TUser;

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }
        async function fetchCourses() {
            try {
                const coursesList = await listCourses();
                setCourses(coursesList);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        }
        fetchOverviewData();
        fetchCourses();
    }, []);

    function handleCourseStatusFilter(e: React.ChangeEvent<HTMLSelectElement>) {
        setStatusFilter(e.currentTarget.value);
    }

    function handleOrderFilter(e: React.ChangeEvent<HTMLSelectElement>) {
        setOrderFilter(e.currentTarget.value);
    }

    const playbackMap = new Map<number, number | null>(
        userData?.courses?.map(c => [
            c.courseId,
            c.playback?.last?.lessonId ?? null
        ])
    );

    const getCourseLink = (course: TCourse) => {
        const lastLessonId = playbackMap.get(course.id)

        return lastLessonId
            ? `/course/${course.slug}/lesson/${lastLessonId}`
            : `/course/${course.slug}`
    }

    const filteredCourses = courses
        .filter(course => {
            if (!statusFilter) return true;
            if (statusFilter === "notInitiated") return course.progressPercentage === 0;
            if (statusFilter === "inProgress") return course.progressPercentage > 0 && course.progressPercentage < 100;
            if (statusFilter === "finshed") return course.progressPercentage === 100;
            return true;
        })
        .filter(course => {
            if (!search) return true;
            return (
                course.title.toLowerCase().includes(search.toLowerCase()) ||
                course.subTitle?.toLowerCase().includes(search.toLowerCase())
            );
        })
        .sort((a, b) => {
            if (orderFilter === "crescent") return a.title.localeCompare(b.title);
            if (orderFilter === "decrescent") return b.title.localeCompare(a.title);
            if (orderFilter === "progress") return b.progressPercentage - a.progressPercentage;
            return 0;
        });

    return (
        <React.Fragment>
            <div className="educators-page-container">
                <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="educators-page-wrapper">
                    <div className="educators-room-container">
                        <div className="header-wrapper">
                            <b>Central de Gestão Pedagógica</b>

                            <div className="filters-wrapper">
                                <div className="search-wrapper">
                                    <input type="search" className="course-search" id="courseSearchInput" placeholder="Pesquisar Temas" value={search} onChange={(e) => setSearch(e.target.value)} />
                                    <button disabled>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                            <path d="M13.6999 2.34726C10.5702 -0.782421 5.47644 -0.782421 2.34675 2.34726C-0.782251 5.47762 -0.782251 10.5707 2.34675 13.7011C5.13382 16.4875 9.47453 16.786 12.6022 14.6102C12.668 14.9216 12.8186 15.2188 13.0608 15.461L17.6186 20.0188C18.2828 20.6817 19.3561 20.6817 20.0169 20.0188C20.6805 19.3553 20.6805 18.282 20.0169 17.6205L15.4591 13.0613C15.2183 12.8212 14.9204 12.6699 14.609 12.604C16.7862 9.47572 16.4877 5.13569 13.6999 2.34726ZM12.2609 12.2621C9.92435 14.5987 6.12164 14.5987 3.78574 12.2621C1.45052 9.92553 1.45052 6.12351 3.78574 3.78693C6.12164 1.45103 9.92435 1.45103 12.2609 3.78693C14.5975 6.12351 14.5975 9.92553 12.2609 12.2621Z" fill="black"/>
                                        </svg>
                                    </button>
                                </div>

                                <select name="courseStatus" id="courseStatusSelect" onChange={handleCourseStatusFilter}>
                                    <option value="">Status da etapa</option>
                                    <option value="notInitiated">Não iniciada</option>
                                    <option value="inProgress">Em andamento</option>
                                    <option value="finshed">Finalizada</option>
                                </select>

                                <select name="order" id="orderSelect" onChange={handleOrderFilter}>
                                    <option value="crescent">A - Z</option>
                                    <option value="decrescent">Z - A</option>
                                    <option value="progress">Progresso</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-wrapper">
                            {
                                filteredCourses.map(course => {
                                    return (
                                        <div className="course-item" key={course.id}>
                                            <img loading="lazy" src={course.cover} className="course-img" />
                                            <div className="description">
                                                <span>{course.title}</span>
                                                <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                                                    <CircularProgressbar
                                                        styles={buildStyles({
                                                            pathColor: '#90C040',
                                                            textColor: '#000000',
                                                            trailColor: '#d7d7da',
                                                            backgroundColor: '#3e98c7'
                                                        })}
                                                        value={course.progressPercentage}
                                                        text={course.progressPercentage + "%"}
                                                        className="course-progress"/>
                                                </div>
                                            </div>
                                            <a href={getCourseLink(course)}>
                                                {course.progressPercentage > 0 ? 'Continuar' : 'Iniciar'}
                                            </a>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>

            <PageSelector />
            <Footer />
        </React.Fragment>
    )
}

export default EducatorsRoom