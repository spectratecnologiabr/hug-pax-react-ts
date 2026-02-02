import React from "react";

import Menubar from "../components/admin/menubar";

import "../style/newAdminDashboard.css";

function AdminDash() {
    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar/>
                <div className="admin-dashboard-wrapper">
                    <div className="admin-header-wrapper">
                        <div>
                            <b>Dashboard</b>
                            <span>Bem-vindo ao PAX Admin</span>
                        </div>
                        <button>Exportar Relatório</button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AdminDash