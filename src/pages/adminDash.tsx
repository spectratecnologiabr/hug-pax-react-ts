import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";

import Menubar from "../components/admin/menubar";
import AdminDatePicker from "../components/admin/AdminDatePicker";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function AdminDash() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
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
                    <div className="main-dash-wrapper">
                        <AdminDatePicker selectedDate={selectedDate} onChange={setSelectedDate} />
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AdminDash