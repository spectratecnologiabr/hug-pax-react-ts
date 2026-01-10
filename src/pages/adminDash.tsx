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

function AdminDash() {
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

            </div>
            <PageSelector />
        </React.Fragment>
    )
}

export default AdminDash