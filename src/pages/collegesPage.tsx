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
    reports: any[],
    educatorsLength: number
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

    function handleViewCollege(event: React.MouseEvent<HTMLButtonElement>) {
        const collegeId = event.currentTarget.getAttribute("data-college-id");
        if (collegeId) {
            window.location.href = `/admin/colleges/${collegeId}`;
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
                                                <td><span>{college.educatorsLength}</span></td>
                                                <td><span>{college.contractSeries ? college.contractSeries.toString().split(',').filter(item => item.trim() !== '').length : 0}</span></td>
                                                <td className="buttons-cell">
                                                    <button className="view-button" title="Visualizar" data-college-id={college.id} onClick={handleViewCollege}>
                                                        <svg height="18" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M11 0C6 0 1.73 3.11 0 7.5C1.73 11.89 6 15 11 15C16 15 20.27 11.89 22 7.5C20.27 3.11 16 0 11 0ZM11 12.5C8.24 12.5 6 10.26 6 7.5C6 4.74 8.24 2.5 11 2.5C13.76 2.5 16 4.74 16 7.5C16 10.26 13.76 12.5 11 12.5ZM11 4.5C9.34 4.5 8 5.84 8 7.5C8 9.16 9.34 10.5 11 10.5C12.66 10.5 14 9.16 14 7.5C14 5.84 12.66 4.5 11 4.5Z" fill="#323232"/>
                                                        </svg>
                                                    </button>
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