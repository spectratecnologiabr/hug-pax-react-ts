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

type TPagination = {
    page: number
    pageSize: number
    total: number
    totalPages: number
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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [courses, setCourses] = useState<TCourse[]>([]);
    const [pagination, setPagination] = useState<TPagination>({ page: 1, pageSize: 12, total: 0, totalPages: 1 });
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
        fetchOverviewData();
    }, []);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const coursesList: any = await listCourses({
                    page,
                    pageSize,
                    search,
                    status: statusFilter,
                    order: orderFilter
                });

                if (Array.isArray(coursesList)) {
                    setCourses(coursesList);
                    setPagination({
                        page,
                        pageSize,
                        total: coursesList.length,
                        totalPages: Math.max(1, Math.ceil(coursesList.length / pageSize))
                    });
                    return;
                }

                setCourses(Array.isArray(coursesList?.items) ? coursesList.items : []);
                setPagination({
                    page: Math.max(1, Number(coursesList?.pagination?.page ?? page)),
                    pageSize: Math.max(1, Number(coursesList?.pagination?.pageSize ?? pageSize)),
                    total: Math.max(0, Number(coursesList?.pagination?.total ?? 0)),
                    totalPages: Math.max(1, Number(coursesList?.pagination?.totalPages ?? 1))
                });
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        }
        fetchCourses();
    }, [orderFilter, page, pageSize, search, statusFilter]);

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

    useEffect(() => {
        setPage(1);
    }, [statusFilter, orderFilter, search]);

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
                                courses.map(course => {
                                    return (
                                        <a className="course-card-link" href={getCourseLink(course)} key={course.id}>
                                            <div className="course-item">
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
                                                <div className="course-action">
                                                    {course.progressPercentage > 0 ? 'Continuar' : 'Iniciar'}
                                                </div>
                                            </div>
                                        </a>
                                    )
                                })
                            }
                        </div>

                        <div className="pagination-wrapper">
                            <span className="pagination-info">
                                {pagination.total > 0
                                    ? `${Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}-${Math.min(pagination.page * pagination.pageSize, pagination.total)} de ${pagination.total}`
                                    : "0 resultados"}
                            </span>

                            <div className="pagination-controls">
                                <label className="pagination-size">
                                    <span>Por página</span>
                                    <select
                                        value={String(pageSize)}
                                        onChange={(e) => {
                                            const nextPageSize = Math.max(1, Number(e.currentTarget.value) || 12);
                                            setPageSize(nextPageSize);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="8">8</option>
                                        <option value="12">12</option>
                                        <option value="16">16</option>
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    className="pagination-button"
                                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                    disabled={page <= 1}
                                >
                                    Anterior
                                </button>

                                <span className="pagination-page">Página {pagination.page} de {pagination.totalPages}</span>

                                <button
                                    type="button"
                                    className="pagination-button"
                                    onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                                    disabled={page >= pagination.totalPages}
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </React.Fragment>
    )
}

export default EducatorsRoom
