import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listCourses } from "../controllers/course/admin/listCourses.controller";
import { listTeachingModalities } from "../controllers/education/listTeachingModalities.controller";

import Menubar from "../components/admin/menubar";

import "../style/courses.css";

type TCourse = {
    id: number,
    slug: string,
    title: string,
    sub_title: string,
    cover: string,
    lessonsCount: number,
    creatorId: number,
    is_active: boolean,
    series: string[],
    createdAt: string,
    updatedAt: string
}

type TModality = {
    id: number,
    name: string,
    slug: string,
    active: boolean,
    createdAt: string
}

function Courses() {
    const [courses, setCourses] = useState<TCourse[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [modalityFilter, setModalityFilter] = useState('');
    const [modalities, setModalities] = useState<TModality[]>([]);

    useEffect(() => {
        async function fetchCourses() {
            try {
                const coursesList = await listCourses();
                setCourses(coursesList);
            } catch (error) {
                console.error("Error fetching courses list:", error);
            }
        }

        async function fetchModalities() {
          try {
            const data = await listTeachingModalities();
            setModalities(data);
          } catch (error) {
            console.error("Error fetching teaching modalities:", error);
          }
        }

        fetchCourses()
        fetchModalities();
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
            <div className="admin-dashboard-container library-page">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Biblioteca de Conteúdos</b>
                            <span>Gerencie trilhas, aulas e materiais educacionais</span>
                        </div>
                        <div className="buttons-wrapper">
                        <a href="/admin/courses/add" className="new-course-button">Nova trilha</a>
                    </div>
                    </div>
                    
                    <div className="library-toolbar">
                        <input
                          className="library-search"
                          placeholder="Buscar conteúdos..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                          className="library-filter"
                          value={modalityFilter}
                          onChange={(e) => setModalityFilter(e.target.value)}
                        >
                          <option value="">Todas Modalidades</option>
                          {modalities.map(modality => (
                            <option key={modality.id} value={modality.id}>
                                {modality.name}
                            </option>
                          ))}
                        </select>

                        <select
                          className="library-filter"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="">Todos os status</option>
                          <option value="published">Publicado</option>
                          <option value="draft">Rascunho</option>
                        </select>
                    </div>

                    <div className="library-grid">
                        {courses
                          .filter(course => {
                            const matchesSearch =
                              course.title.toLowerCase().includes(search.toLowerCase()) ||
                              (course.sub_title || '').toLowerCase().includes(search.toLowerCase());

                            const matchesStatus = statusFilter
                              ? statusFilter === 'published'
                                ? course.is_active
                                : !course.is_active
                              : true;

                            const matchesModality = modalityFilter
                              ? (course.series || []).includes(modalityFilter)
                              : true;

                            return matchesSearch && matchesStatus && matchesModality;
                          })
                          .map(course => (
                            <div className="library-card" key={course.id}>
                                <div className="library-cover" style={{ backgroundImage: `url(${course.cover || '/placeholder.jpg'})` }}>
                                    <span className="library-badge">
                                        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.30225 3.06955C2.09873 3.06955 1.90355 3.15039 1.75964 3.2943C1.61573 3.43821 1.53488 3.6334 1.53488 3.83692V12.5338C1.53488 12.7373 1.61573 12.9325 1.75964 13.0764C1.90355 13.2203 2.09873 13.3011 2.30225 13.3011H14.0686C14.2721 13.3011 14.4673 13.2203 14.6112 13.0764C14.7551 12.9325 14.8359 12.7373 14.8359 12.5338V4.86007C14.8359 4.65656 14.7551 4.46137 14.6112 4.31746C14.4673 4.17355 14.2721 4.09271 14.0686 4.09271H7.03788C6.68436 4.0927 6.33874 3.98804 6.04461 3.79192C6.04459 3.79191 6.04462 3.79193 6.04461 3.79192L5.15442 3.19846C5.02836 3.11441 4.88024 3.06955 4.72873 3.06955C4.72873 3.06955 4.72874 3.06955 4.72873 3.06955H2.30225ZM1.03615 2.57082C1.37194 2.23503 1.82737 2.04639 2.30225 2.04639H4.72873C5.08225 2.0464 5.42787 2.15105 5.722 2.34717C5.72199 2.34716 5.72202 2.34718 5.722 2.34717L6.61219 2.94063C6.73825 3.02468 6.88637 3.06954 7.03788 3.06955C7.03787 3.06955 7.03788 3.06955 7.03788 3.06955H14.0686C14.5435 3.06955 14.9989 3.25819 15.3347 3.59398C15.6705 3.92977 15.8591 4.3852 15.8591 4.86007V12.5338C15.8591 13.0086 15.6705 13.4641 15.3347 13.7999C14.9989 14.1357 14.5435 14.3243 14.0686 14.3243H2.30225C1.82737 14.3243 1.37194 14.1357 1.03615 13.7999C0.700363 13.4641 0.511719 13.0086 0.511719 12.5338V3.83692C0.511719 3.36204 0.700363 2.90661 1.03615 2.57082Z" fill="white"/>
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.511719 6.13902C0.511719 5.85649 0.740761 5.62744 1.0233 5.62744H15.3475C15.6301 5.62744 15.8591 5.85649 15.8591 6.13902C15.8591 6.42156 15.6301 6.6506 15.3475 6.6506H1.0233C0.740761 6.6506 0.511719 6.42156 0.511719 6.13902Z" fill="white"/>
                                        </svg>
                                        Trilha 
                                    </span>
                                </div>

                            <div className="library-card-body">
                                <div className="library-card-title-row">
                                    <h3>{course.title}</h3>
                                    <button className="library-edit-button" onClick={() => window.location.href = `/admin/courses/edit/${course.id}`} title="Editar trilha" >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                                <p>{course.sub_title || 'Trilha completa de aprendizagem'}</p>

                                <div className="library-meta">
                                    <span className={course.is_active ? "status active" : "status draft"}>
                                        {course.is_active ? 'Publicado' : 'Rascunho'}
                                    </span>
                                    <span className="lessons">
                                        <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14.0456 7.37011V3.36107L14.212 3.31113C14.8518 3.11912 14.9861 2.79405 14.9861 2.55516C14.986 2.31626 14.8517 1.99119 14.212 1.79927L8.73735 0.156856C8.40016 0.0557002 7.95825 0 7.4931 0C7.02791 0 6.58603 0.0557002 6.24875 0.156856L0.774154 1.79927C0.134319 1.99119 0 2.31626 0 2.55518C0 2.79408 0.134289 3.11918 0.774125 3.31116L2.82163 3.92542V7.23516C2.82163 7.64614 3.08877 8.22506 4.36145 8.6493C5.20441 8.93029 6.31657 9.08503 7.49304 9.08503C8.66947 9.08503 9.78163 8.93029 10.6246 8.6493C11.8973 8.22503 12.1645 7.64614 12.1645 7.23516V3.92544L13.1675 3.62452V7.37011C12.6215 7.55398 12.2269 8.07044 12.2269 8.67767V10.5587C12.2269 11.3194 12.8458 11.9383 13.6065 11.9383C14.3672 11.9383 14.9861 11.3194 14.9861 10.5587V8.67767C14.9861 8.07044 14.5916 7.55395 14.0456 7.37011ZM6.50106 0.99792C6.75497 0.921731 7.11654 0.878061 7.4931 0.878061C7.86959 0.878061 8.23116 0.921731 8.48505 0.997891L13.6759 2.55518L11.5971 3.17886C11.5959 3.17924 11.5947 3.17957 11.5935 3.17995L8.48508 4.11251C8.23119 4.18867 7.86965 4.23234 7.49313 4.23234C7.1166 4.23234 6.755 4.18867 6.50112 4.11251L3.39268 3.17995C3.39148 3.17957 3.39031 3.17924 3.38911 3.17886L1.31026 2.55518L6.50106 0.99792ZM11.2864 6.08215C11.2864 7.29174 11.127 7.55622 10.347 7.81622C9.59118 8.06818 8.57763 8.20691 7.49307 8.20691C6.40848 8.20691 5.39493 8.06818 4.63916 7.81622C3.85918 7.55622 3.69972 7.29171 3.69972 7.23513V4.18881L6.24878 4.95354C6.586 5.0547 7.02791 5.1104 7.4931 5.1104C7.95825 5.1104 8.40014 5.0547 8.73738 4.95354L11.2864 4.18881V6.08215ZM14.108 10.5587C14.108 10.8352 13.883 11.0602 13.6065 11.0602C13.33 11.0602 13.1051 10.8352 13.1051 10.5587V8.67764C13.1051 8.4011 13.33 8.17611 13.6065 8.17611C13.8831 8.17611 14.108 8.4011 14.108 8.67764V10.5587Z" fill="#CCCCCC"/>
                                        </svg>
                                        <span>{course.lessonsCount}</span>
                                        <span>aulas</span>
                                    </span>
                                </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Courses