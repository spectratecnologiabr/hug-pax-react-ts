import React, { useEffect, useState } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";
import { listCourses } from "../controllers/course/listCourses.controller";
import { listProgress } from "../controllers/user/listProgress.controller";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import AsideMenu from "../components/asideMenu";
import Feed from "../components/dash/feed";
import FastLinks from "../components/dash/fastLinks";
import EducatorsRoom from "../components/dash/educatorsRoom";

import alunoImage from "../img/dash/aluno.svg";
import notificationIcon from "../img/notification.svg";
import alunoIcon from "../img/dash/aluno-icon.svg";
import medio1img from "../img/dash/1-medio.svg";
import medio2img from "../img/dash/2-medio.svg";
import medio3img from "../img/dash/3-medio.svg";

import "../style/dash.css";
import Footer from "../components/footer";

type TUser = {
    id: number,
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    language: string,
    courses: [],
    role: string,
    isActive: boolean
}

type TCourse = {
    id: number,
    slug: string,
    title: string,
    cover: string,
    subTitle: string,
    createdAt: string,
    updatedAt: string,
    progressPercentage: number
}

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number
}

function Dashboard() {
    const userData = getCookies("userData") as unknown as TUser;
    const [courses, setCourses] = useState<TCourse[]>([]);
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [ progress, setProgress ] = useState<number | null>(null);

    useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        async function fetchCourses() {
            try {
                const coursesList = await listCourses();
                setCourses(coursesList);
            } catch (error) {
                console.error("Error fetching courses:", error);
            }
        }

        async function fetchProgress() {
            try {
                const progressData = await listProgress();
                setProgress(progressData);
            } catch (error) {
                console.error("Error fetching progress:", error);
            }
        }

        fetchCourses();
        fetchOverviewData();
        fetchProgress();
    }, []);


    function swipeCourses(e: React.MouseEvent<HTMLButtonElement>) {
        const direction = e.currentTarget.dataset.direction;
        const actualSlide = document.getElementById("last-courses-swiper")?.querySelector(".active");
        var nextShowedSlide;

        if (direction === "previous") {
            nextShowedSlide = actualSlide?.previousElementSibling;
            if (nextShowedSlide) {
                actualSlide?.classList.remove("active");
                nextShowedSlide?.classList.add("active");
            }
        } else if (direction === "next") {
            nextShowedSlide = actualSlide?.nextElementSibling;
            if (nextShowedSlide) {
                actualSlide?.classList.remove("active");
                nextShowedSlide?.classList.add("active");
            }
        }
    }

    return (
        <React.Fragment>
        <div className="dashboard-container">
            <AsideMenu/>
            <div className="dashboard-wrapper">
                <div className="main-dash-wrapper">
                    <div className="greatings-card">
                        <div className="wrapper">
                            <b className="main-greating">Olá <span id="nomeAluno">{userData.firstName}</span></b>
                            <span>Bom te ver de novo!</span>
                        </div>
                        <div className="wrapper">
                            <img src={alunoImage} alt="" />
                        </div>
                        <div className="wrapper">
                            <span>Este é o seu engajamento no fórum!</span>
                            <b id="percentage">0%</b>
                        </div>
                    </div>
                    <div className="search-wrapper">
                        <button disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                <path d="M13.6999 2.34726C10.5702 -0.782421 5.47644 -0.782421 2.34675 2.34726C-0.782251 5.47762 -0.782251 10.5707 2.34675 13.7011C5.13382 16.4875 9.47453 16.786 12.6022 14.6102C12.668 14.9216 12.8186 15.2188 13.0608 15.461L17.6186 20.0188C18.2828 20.6817 19.3561 20.6817 20.0169 20.0188C20.6805 19.3553 20.6805 18.282 20.0169 17.6205L15.4591 13.0613C15.2183 12.8212 14.9204 12.6699 14.609 12.604C16.7862 9.47572 16.4877 5.13569 13.6999 2.34726ZM12.2609 12.2621C9.92435 14.5987 6.12164 14.5987 3.78574 12.2621C1.45052 9.92553 1.45052 6.12351 3.78574 3.78693C6.12164 1.45103 9.92435 1.45103 12.2609 3.78693C14.5975 6.12351 14.5975 9.92553 12.2609 12.2621Z" fill="black"/>
                            </svg>
                        </button>
                        <input type="search" className="main-search" id="mainSearchInput" />
                    </div>
                    <div className="profile-wrapper">
                        <button className="notitications-button">
                            <img src={notificationIcon} alt="" />
                        </button>
                        <button className="profile-button">
                            <img src={alunoIcon} alt="" className="profile-photo" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="5" viewBox="0 0 8 5" fill="none">
                                <path d="M4.02125 4.02116L6.99829 1.04411C7.17993 0.862473 7.17993 0.567893 6.99829 0.386256C6.81662 0.204581 6.52211 0.204581 6.34044 0.386256L4.15748 2.56921C4.15748 2.56921 3.93782 2.81522 3.69409 2.81006C3.45622 2.80502 3.22716 2.56921 3.22716 2.56921L1.0442 0.38633C0.862523 0.204656 0.568018 0.204656 0.386343 0.38633C0.295581 0.47713 0.250107 0.596212 0.250107 0.715257C0.250107 0.834301 0.295581 0.953347 0.386343 1.04418L3.36339 4.02116C3.54507 4.20283 3.83957 4.20283 4.02125 4.02116Z" fill="black" stroke="black" stroke-width="0.5"/>
                            </svg>
                        </button>
                    </div>

                    <div className="finshed-courses">
                        <b>{overviewData?.completedCourses}</b>
                        <span>Formações <br />Finalizadas</span>
                    </div>

                    <div className="remaing-courses">
                        <b>{overviewData?.inProgressCourses}</b>
                        <span>Formações <br />Em Progresso</span>
                    </div>

                    <div className="last-courses" id="last-courses-swiper">
                        {
                            courses.map((course, index) => (
                                <div key={course.id} className={`course-item ${index === 0 ? 'active' : ''}`}>
                                    <img loading="lazy" src={course.cover} className="course-img" />
                                    <b>{course.title}</b>
                                    <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                                        <CircularProgressbar
                                            styles={buildStyles({
                                                pathColor: '#90C040',
                                                textColor: '#000000',
                                                trailColor: '#d7d7da',
                                                backgroundColor: '#3e98c7'
                                            })}
                                            value={course.progressPercentage} // Random progress for demo
                                            text={`${course.progressPercentage}%`}
                                            className="course-progress"/>
                                    </div>
                                    <a className="open-course" href={`/course/${course.slug}`}>Continue</a>
                                </div>
                            ))
                        }
                    </div>

                    <div className="last-courses-controls">
                        <button className="control-button" data-direction="previous" onClick={swipeCourses}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="39" y="1" width="38" height="38" rx="19" transform="rotate(90 39 1)" stroke="black" stroke-width="2"/>
                                <path d="M17.7239 24.8114C17.6354 24.8999 17.4911 24.8999 17.4026 24.8114L12.7522 20.16C12.6637 20.0714 12.6637 19.9282 12.7522 19.8397L17.4026 15.1893C17.447 15.1449 17.5042 15.123 17.5627 15.1229C17.6214 15.1229 17.6795 15.1449 17.7239 15.1893L17.7249 15.1893C17.8124 15.2779 17.812 15.4214 17.7239 15.5096L14.3127 18.9198L13.4592 19.7733L27.0881 19.7733C27.2131 19.7734 27.3146 19.8749 27.3147 19.9999C27.3147 20.125 27.2132 20.2263 27.0881 20.2264L13.4592 20.2264L17.7239 24.4911C17.8121 24.5796 17.8122 24.7229 17.7239 24.8114Z" fill="black" stroke="black"/>
                            </svg>
                        </button>
                        <button className="control-button" data-direction="next" onClick={swipeCourses}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="39" width="38" height="38" rx="19" transform="rotate(-90 1 39)" stroke="black" stroke-width="2"/>
                                <path d="M22.2761 15.1886C22.3646 15.1001 22.5089 15.1001 22.5974 15.1886L27.2478 19.84C27.3363 19.9285 27.3363 20.0717 27.2478 20.1603L22.5974 24.8107C22.553 24.8551 22.4958 24.877 22.4373 24.8771C22.3786 24.8771 22.3205 24.8551 22.2761 24.8107H22.2751C22.1876 24.7221 22.188 24.5786 22.2761 24.4904L25.6873 21.0802L26.5408 20.2267H12.9119C12.7869 20.2266 12.6854 20.1251 12.6853 20.0001C12.6853 19.875 12.7868 19.7736 12.9119 19.7736H26.5408L22.2761 15.5089C22.1879 15.4204 22.1878 15.2771 22.2761 15.1886Z" fill="black" stroke="black"/>
                            </svg>
                        </button>
                    </div>

                    <div className="finshed-hours">
                        <b>{overviewData?.totalHours}</b>
                        <span>Total de horas em formação</span>
                    </div>
                </div>
                <FastLinks />
                <EducatorsRoom courses={courses} />
            </div>
            <Feed/>
        </div>
        <Footer />
        </React.Fragment>
    )
}

export default Dashboard;