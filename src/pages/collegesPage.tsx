import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listColleges } from "../controllers/college/listColleges.controller";

import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TCollege = {
    id: number,
    name: string,
    partner: string,
    address: string,
    addressNumber: number,
    state: string,
    city: string,
    management: string,
    salesManager: string,
    coordinator: string,
    collegeSeries: any[],
    contractSeries: any[],
    internalManagement: any[],
    visits: any[],
    reports: any[]
}

function CollegesPage() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ colleges, setColleges ] = useState<TCollege[] | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchColleges() {
            try {
                const collegesList = await listColleges();
                setColleges(collegesList);
            } catch (error) {
                console.error("Error fetching colleges list:", error);
            }
        }

        fetchColleges()
        fetchOverviewData()
    }, []);

    function handleEditCollege(event: React.MouseEvent<HTMLButtonElement>) {
        const collegeId = event.currentTarget.getAttribute("data-college-id");
        if (collegeId) {
            window.location.href = `/admin/colleges/edit/${collegeId}`;
        }
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="listing-container">
                        <div className="buttons-wrapper">
                            <a href="/admin/colleges/add" className="new-college-button">Nova Escola</a>
                        </div>
                        <div className="listing-table-container">
                            <table className="listing-table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Cidade / UF</th>
                                        <th>Parceiro Contratante</th>
                                        <th>Educadores</th>
                                        <th>Séries Contratadas</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        colleges && colleges.map((college) => (
                                            <tr key={college.id}>
                                                <td><span>{college.name.toLocaleUpperCase()}</span></td>
                                                <td><span>{college.city.toLocaleUpperCase()} - {college.state.toLocaleUpperCase()}</span></td>
                                                <td><span>{college.partner.toLocaleUpperCase()}</span></td>
                                                <td><span>{college.internalManagement.length}</span></td>
                                                <td><span>{college.contractSeries ? college.contractSeries.toString().split(',').filter(item => item.trim() !== '').length : 0}</span></td>
                                                <td className="buttons-cell">
                                                    <button className="edit-button" title="Editar" data-college-id={college.id} onClick={handleEditCollege}>
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

export default CollegesPage;