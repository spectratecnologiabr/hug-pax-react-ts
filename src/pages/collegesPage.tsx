import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";

import PageSelector from "../components/pageSelector";
import Menubar from "../components/admin/menubar";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function CollegesPage() {
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        fetchOverviewData()
    }, []);

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="listing-container">
                        <div className="buttons-wrapper">
                            <div className="search-wrapper">
                                <input id="searchInput" placeholder="Busca por nome ou cidade" type="text" name="searchInput"/>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.52638 8.38358H8.92426L8.71085 8.17781C9.62546 7.11087 10.098 5.65526 9.83887 4.1082C9.48065 1.98956 7.7124 0.297696 5.57831 0.0385818C2.3543 -0.35771 -0.351424 2.35537 0.0372858 5.57905C0.296426 7.71293 1.98846 9.481 4.10731 9.83919C5.65453 10.0983 7.11028 9.6258 8.17733 8.71128L8.38312 8.92467V9.52673L11.63 12.7657C11.9425 13.0781 12.4455 13.0781 12.758 12.7657L12.7656 12.758C13.0781 12.4456 13.0781 11.9426 12.7656 11.6301L9.52638 8.38358ZM4.95332 8.38358C3.0555 8.38358 1.52353 6.85176 1.52353 4.95413C1.52353 3.0565 3.0555 1.52468 4.95332 1.52468C6.85114 1.52468 8.38312 3.0565 8.38312 4.95413C8.38312 6.85176 6.85114 8.38358 4.95332 8.38358Z" fill="#6B7280"></path>
                                </svg>
                            </div>
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
                                <tr>
                                    <td><span>COLÉGIO ESTADUAL CALDAS JUNIOR</span></td>
                                    <td><span>NEÓPOLIS - SE</span></td>
                                    <td><span>SEED - SERGIPE</span></td>
                                    <td><span>40</span></td>
                                    <td><span>9</span></td>
                                    <td className="buttons-cell">
                                        <button className="edit-button" title="Editar" data-exame-id="exame_00035">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><span>COLÉGIO ESTADUAL CALDAS JUNIOR</span></td>
                                    <td><span>NEÓPOLIS - SE</span></td>
                                    <td><span>SEED - SERGIPE</span></td>
                                    <td><span>40</span></td>
                                    <td><span>9</span></td>
                                    <td className="buttons-cell">
                                        <button className="edit-button" title="Editar" data-exame-id="exame_00035">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><span>COLÉGIO ESTADUAL CALDAS JUNIOR</span></td>
                                    <td><span>NEÓPOLIS - SE</span></td>
                                    <td><span>SEED - SERGIPE</span></td>
                                    <td><span>40</span></td>
                                    <td><span>9</span></td>
                                    <td className="buttons-cell">
                                        <button className="edit-button" title="Editar" data-exame-id="exame_00035">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><span>COLÉGIO ESTADUAL CALDAS JUNIOR</span></td>
                                    <td><span>NEÓPOLIS - SE</span></td>
                                    <td><span>SEED - SERGIPE</span></td>
                                    <td><span>40</span></td>
                                    <td><span>9</span></td>
                                    <td className="buttons-cell">
                                        <button className="edit-button" title="Editar" data-exame-id="exame_00035">
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0 14.4625V17.5025C0 17.7825 0.22 18.0025 0.5 18.0025H3.54C3.67 18.0025 3.8 17.9525 3.89 17.8525L14.81 6.9425L11.06 3.1925L0.15 14.1025C0.0500001 14.2025 0 14.3225 0 14.4625ZM17.71 4.0425C18.1 3.6525 18.1 3.0225 17.71 2.6325L15.37 0.2925C14.98 -0.0975 14.35 -0.0975 13.96 0.2925L12.13 2.1225L15.88 5.8725L17.71 4.0425Z" fill="#333333"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <PageSelector />
        </React.Fragment>
    )
}

export default CollegesPage;