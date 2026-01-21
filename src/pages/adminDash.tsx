import React, { useState, useEffect } from "react";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { getConsultanOverviewData } from "../controllers/dash/consultantOverview.controller";

import Menubar from "../components/admin/menubar";
import AdminDatePicker from "../components/admin/AdminDatePicker";
import SchedulingList from "../components/admin/SchedulingList";

import "../style/adminDash.css";

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

type TConsultantOverviewData = {
    activeColleges: number,
    activeEducators: number,
    scheduledThisMonth: number,
    rescheduledThisMonth: number,
    cancelledThisMonth: number,
    completedThisMonth: number
}

function AdminDash() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [overviewData, setOverviewData] = useState<TOverviewData | null>(null);
    const [consultantOverviewData, setConsultantOverviewData] = useState<TConsultantOverviewData | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchConsultamtOverviewData() {
            try {
                const fetchedData = await getConsultanOverviewData();
                setConsultantOverviewData(fetchedData);
            } catch (error) {
                console.error("Error fetching consultant overview data:", error);
            }
        }

        fetchConsultamtOverviewData()
        fetchOverviewData()
    }, []);

    function handleDateChange(date: Date | null) {
        setSelectedDate(date || new Date());
    }

    return (
        <React.Fragment>
            <div className="admin-dashboard-container">
                <Menubar notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="admin-dashboard-wrapper">
                    <div className="main-dash-wrapper">
                        <div className="cards-list">
                            <div className="card-item">
                                <span>Escolas Ativas</span>
                                <b>{consultantOverviewData?.activeColleges}</b>
                            </div>
                            <div className="card-item">
                                <span>Educadores Ativos</span>
                                <b>{consultantOverviewData?.activeEducators}</b>
                            </div>
                            <div className="card-item">
                                <span>Agendamentos desse mês</span>
                                <b>{consultantOverviewData?.scheduledThisMonth}</b>
                            </div>
                            <div className="card-item">
                                <span>Reagendamentos desse mês</span>
                                <b>{consultantOverviewData?.rescheduledThisMonth}</b>
                            </div>
                            <div className="card-item">
                                <span>Cancelamentos desse mês</span>
                                <b>{consultantOverviewData?.cancelledThisMonth}</b>
                            </div>
                            <div className="card-item">
                                <span>Visitas realizadas esse mês</span>
                                <b>{consultantOverviewData?.completedThisMonth}</b>
                            </div>
                        </div>
                        <SchedulingList selectedDate={selectedDate} />
                        <AdminDatePicker selectedDate={selectedDate} onChange={handleDateChange} />
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AdminDash