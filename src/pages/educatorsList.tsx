import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listEducators } from "../controllers/user/listEducators.controller";
import { findCollege } from "../controllers/college/findCollege.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

import Menubar from "../components/consultant/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TEducator = {
    id: number,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    isActive: boolean,
    collegeId: number | null,
    createdAt: string
}

type TRole = 'consultant' | 'coordinator' | 'admin'

function EducatorsList() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [educators, setEducators] = useState<TEducator[]>(([]));
    const [collegeMap, setCollegeMap] = useState<Record<number, string>>({});
    const [ userRole, setUserRole ] = useState<TRole | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchEducators() {
            try {
                const educatorsList = await listEducators();
                setEducators(educatorsList);
            } catch (error) {
                console.error("Error fetching educators:", error);
            }
        }

        async function fetchUserRole() {
            try {
                const sessionData = await checkSession();
                setUserRole(sessionData.session.role);
            } catch (error) {
                console.error("Error fetching userData:", error)
            }
        }

        fetchOverviewData();
        fetchEducators();
        fetchUserRole();
    }, []); 

    useEffect(() => {
        if (!educators.length) return;

        async function fetchColleges() {
            try {
                const map: Record<number, string> = {};
                const collegeIdSet = new Set(educators.map(e => e.collegeId).filter(Boolean) as number[]);
                const uniqueCollegeIds = Array.from(collegeIdSet);

                for (const id of uniqueCollegeIds) {
                    const college = await findCollege(id.toString());
                    map[id] = college.name;
                }

                setCollegeMap(map);
            } catch (error) {
                console.error("Error fetching colleges:", error);
            }
        }

        fetchColleges();
    }, [educators]);

    function handleEditEducator(event: React.MouseEvent<HTMLButtonElement>) {
        const educatorId = event.currentTarget.getAttribute("data-educator-id");
        if (educatorId) {
            window.location.href = `/consultant/educators/edit/${educatorId}`;
        }
    }

    function handleViewEducator(event: React.MouseEvent<HTMLButtonElement>) {
        const educatorId = event.currentTarget.getAttribute("data-educator-id");
        if (educatorId) {
            window.location.href = `/consultant/educators/${educatorId}`;
        }
    }

  return (
    <React.Fragment>
        <div className="admin-dashboard-container">
            <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
            <div className="admin-dashboard-wrapper">
                <div className="listing-container">
                    {   
                        (userRole !== "consultant") ?
                            <div className="buttons-wrapper">
                                <a href="/consultant/educators/add" className="new-college-button">Novo Educador</a>
                            </div>
                        : ""
                    }
                    <div className="listing-table-container">
                        <table className="listing-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Escola Associada</th>
                                    <th>Criado Em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {educators.map((educator) => (
                                    <tr key={educator.id}>
                                        <td>{educator.firstName} {educator.lastName}</td>
                                        <td>{educator.email}</td>
                                        <td>{educator.isActive ? "Ativo" : "Inativo"}</td>
                                        <td>{educator.collegeId ? collegeMap[educator.collegeId] || "Carregando..." : "-"}</td>
                                        <td>{new Date(educator.createdAt).toLocaleDateString()}</td>
                                        <td className="buttons-cell">
                                            <button className="view-button" title="Visualizar" data-educator-id={educator.id} onClick={handleViewEducator}>
                                                <svg height="18" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 0C6 0 1.73 3.11 0 7.5C1.73 11.89 6 15 11 15C16 15 20.27 11.89 22 7.5C20.27 3.11 16 0 11 0ZM11 12.5C8.24 12.5 6 10.26 6 7.5C6 4.74 8.24 2.5 11 2.5C13.76 2.5 16 4.74 16 7.5C16 10.26 13.76 12.5 11 12.5ZM11 4.5C9.34 4.5 8 5.84 8 7.5C8 9.16 9.34 10.5 11 10.5C12.66 10.5 14 9.16 14 7.5C14 5.84 12.66 4.5 11 4.5Z" fill="#323232"/>
                                                </svg>
                                            </button>
                                            {(userRole !== "consultant") ?
                                                <button className="edit-button" title="Editar" data-educator-id={educator.id} onClick={handleEditEducator}>
                                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                                    </svg>
                                                </button>
                                                : ""
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </React.Fragment>
  );
}

export default EducatorsList;