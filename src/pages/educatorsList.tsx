import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listEducators } from "../controllers/user/listEducators.controller";
import { findCollege } from "../controllers/college/findCollege.controller";

import Menubar from "../components/admin/menubar";

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

function EducatorsList() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [educators, setEducators] = useState<TEducator[]>(([]));
    const [collegeMap, setCollegeMap] = useState<Record<number, string>>({});

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

        fetchOverviewData();
        fetchEducators();
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
            window.location.href = `/admin/educators/edit/${educatorId}`;
        }
    }

  return (
    <React.Fragment>
        <div className="admin-dashboard-container">
            <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
            <div className="admin-dashboard-wrapper">
                <div className="listing-container">
                    <div className="buttons-wrapper">
                        <a href="/admin/educators/add" className="new-college-button">Novo Educador</a>
                    </div>
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
                                            <button className="edit-button" title="Editar" data-educator-id={educator.id} onClick={handleEditEducator}>
                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                                </svg>
                                            </button>
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