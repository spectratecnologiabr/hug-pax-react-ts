import React, { useState, useEffect } from "react";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import "../../style/educatorsRoom.css";

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

type TCourseProps = {
    courses: Array<TCourse>
    getCourseLink: (course: TCourse) => string
}

function EducatorsRoom(coursesProp: TCourseProps) {
    const [statusFilter, setStatusFilter] = useState("");
    const [orderFilter, setOrderFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);


    function handleCourseStatusFilter(e: React.ChangeEvent<HTMLSelectElement>) {
        const filterValue = e.currentTarget.value;
        setStatusFilter(filterValue);
    }

    function handleOrderFilter(e: React.ChangeEvent<HTMLSelectElement>) {
        const filterValue = e.currentTarget.value;
        setOrderFilter(filterValue);
    }

    const filteredCourses = coursesProp.courses
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

    const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
    const paginatedCourses = filteredCourses.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, orderFilter, search]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);


    return (
        <div className="educators-room-element">
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
                        <option value="">Ordenação</option>
                        <option value="crescent">A - Z</option>
                        <option value="decrescent">Z - A</option>
                        <option value="progress">Progresso</option>
                    </select>
                </div>
            </div>

            <div className="grid-wrapper">
                {
                    paginatedCourses.map(course => {
                        return (
                            <a className="course-card-link" href={coursesProp.getCourseLink(course)} key={course.id}>
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
                    {filteredCourses.length > 0
                        ? `${Math.min((page - 1) * pageSize + 1, filteredCourses.length)}-${Math.min(page * pageSize, filteredCourses.length)} de ${filteredCourses.length}`
                        : "0 resultados"}
                </span>

                <div className="pagination-controls">
                    <label className="pagination-size">
                        <span>Por página</span>
                        <select
                            value={String(pageSize)}
                            onChange={(e) => {
                                const nextPageSize = Math.max(1, Number(e.currentTarget.value) || 8);
                                setPageSize(nextPageSize);
                                setPage(1);
                            }}
                        >
                            <option value="4">4</option>
                            <option value="8">8</option>
                            <option value="12">12</option>
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

                    <span className="pagination-page">Página {page} de {totalPages}</span>

                    <button
                        type="button"
                        className="pagination-button"
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages}
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EducatorsRoom;
