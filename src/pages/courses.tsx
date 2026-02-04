import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listCourses } from "../controllers/course/admin/listCourses.controller";

import Menubar from "../components/admin/menubar";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TCourse = {
    id: number,
    slug: string,
    title: string,
    subTitle: string,
    cover: string,
    creatorId: number,
    isActive: boolean,
    createdAt: string,
    updatedAt: string
}

function Courses() {
    const [ courses, setCourses ] = useState<TCourse[]>([]);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const coursesList = await listCourses();
                setCourses(coursesList);
            } catch (error) {
                console.error("Error fetching courses list:", error);
            }
        }

        fetchCourses()
    }, []);

    const formatDate = (date: string) => {
        const d = new Date(date);

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();

        const hora = String(d.getHours() + 3).padStart(2, '0');
        const minuto = String(d.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    };

    function handleEditCourse(event: React.MouseEvent<HTMLButtonElement>) {
        const courseId = event.currentTarget.getAttribute("data-course-id");
        if (courseId) {
            window.location.href = `/admin/courses/edit/${courseId}`;
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Trilhas</b>
                            <span>Gerencie trilhas e conteúdos</span>
                        </div>
                    </div>
                    <div className="listing-container">
                        <div className="buttons-wrapper">
                            <a href="/admin/courses/add" className="new-course-button">Nova trilha</a>
                        </div>
                        <div className="listing-table-container">
                            <table className="listing-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Título</th>
                                        <th>Status</th>
                                        <th>Criado em</th>
                                        <th>Última alteração</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        courses && courses.map((course) => (
                                            <tr key={course.id}>
                                                <td><span>{course.id}</span></td>
                                                <td><span>{course.title}</span></td>
                                                <td><span>{course.isActive ? "Ativo" : "Inativo"}</span></td>
                                                <td><span>{formatDate(course.createdAt)}</span></td>
                                                <td><span>{formatDate(course.updatedAt)}</span></td>
                                                <td className="buttons-cell">
                                                    <button className="edit-button" title="Editar" data-course-id={course.id} onClick={handleEditCourse}>
                                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Courses