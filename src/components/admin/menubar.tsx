import React, { useState, useEffect } from "react";
import { getCookies } from "../../controllers/misc/cookies.controller";
import { doLogout } from "../../controllers/user/logout.controller";
import { checkSession } from "../../controllers/user/checkSession.controller";

import PageSelector from "../pageSelector";

import paxIconWhite from "../../img/pax-icon-white.svg";
import homeIcon from "../../img/menu/home.svg";

import "../../style/menubar.css";

type TRole = 'consultant' | 'coordinator' | 'admin'

function Menubar() {
    const userName = (getCookies("userData")).firstName;
    const pathname = window.location.pathname;
    const [ userRole, setUserRole ] = useState<TRole | null>(null);

    useEffect(() => {
        async function fetchUserRole() {
            try {
                const sessionData = await checkSession();
                setUserRole(sessionData.session.role);
            } catch (error) {
                console.error("Error fetching userData:", error)
            }
        }

        fetchUserRole();
    }, []); 

    return (
        <div className="admin-menubar admin-menubar-hover-labels">
            <div className="logo-wrapper">
                <img src={paxIconWhite} className="pax-logo" />
                <b>Olá {userName}!</b>
            </div>


            <div className="menu-wrapper">
                <a href="/admin" className={pathname.endsWith("/admin") ? "menu-link selected" : "menu-link"}>
                    <img src={homeIcon} />

                    <span>Dashboard</span>
                </a>

                <a href="/admin/performance" className={pathname.includes("/admin/performance") ? "menu-link selected" : "menu-link"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 18L9 12L13 15L20 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20 12V7H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 21H21" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span>Performance</span>
                </a>

                <a href="/admin/series" className={pathname.includes("/admin/series") ? "menu-link selected" : "menu-link"}>
                <svg height="20" viewBox="0 0 23 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.6835 10.8532V4.9495L20.9286 4.87597C21.8707 4.59322 22.0685 4.11452 22.0685 3.76272C22.0684 3.41092 21.8706 2.93222 20.9285 2.6496L12.8666 0.230986C12.3701 0.0820241 11.7193 0 11.0343 0C10.3493 0 9.69858 0.0820241 9.20191 0.230986L1.14002 2.6496C0.197797 2.93222 0 3.41092 0 3.76276C0 4.11456 0.197754 4.5933 1.13997 4.87601L4.15512 5.78056V10.6545C4.15512 11.2597 4.54852 12.1122 6.42266 12.7369C7.66401 13.1507 9.30178 13.3786 11.0342 13.3786C12.7667 13.3786 14.4044 13.1507 15.6458 12.7369C17.52 12.1122 17.9134 11.2597 17.9134 10.6545V5.78061L19.3904 5.33747V10.8532C18.5864 11.124 18.0054 11.8845 18.0054 12.7787V15.5488C18.0054 16.6689 18.9167 17.5803 20.0369 17.5803C21.1571 17.5803 22.0685 16.669 22.0685 15.5488V12.7787C22.0685 11.8845 21.4875 11.1239 20.6835 10.8532ZM9.57345 1.46954C9.94737 1.35734 10.4798 1.29303 11.0343 1.29303C11.5888 1.29303 12.1212 1.35734 12.4951 1.46949L20.1392 3.76276L17.0779 4.68119C17.0761 4.68175 17.0744 4.68222 17.0726 4.68279L12.4951 6.05607C12.1212 6.16823 11.5888 6.23254 11.0344 6.23254C10.4799 6.23254 9.94741 6.16823 9.57354 6.05607L4.99605 4.68279C4.99429 4.68222 4.99256 4.68175 4.9908 4.68119L1.92948 3.76276L9.57345 1.46954ZM16.6204 8.95657C16.6204 10.7378 16.3856 11.1273 15.2369 11.5102C14.124 11.8812 12.6314 12.0855 11.0343 12.0855C9.43712 12.0855 7.94457 11.8812 6.83162 11.5102C5.68302 11.1273 5.4482 10.7378 5.4482 10.6544V6.16844L9.20195 7.29458C9.69854 7.44354 10.3493 7.52557 11.0343 7.52557C11.7193 7.52557 12.37 7.44354 12.8667 7.29458L16.6204 6.16844V8.95657ZM20.7754 15.5487C20.7754 15.9559 20.4442 16.2872 20.037 16.2872C19.6298 16.2872 19.2985 15.9559 19.2985 15.5487V12.7787C19.2985 12.3715 19.6297 12.0401 20.037 12.0401C20.4442 12.0401 20.7754 12.3715 20.7754 12.7787V15.5487Z" fill="white"/>
                </svg>

                    <span>Séries</span>
                </a>

                <a href="/admin/colleges" className={pathname.includes("/admin/colleges") ? "menu-link selected" : "menu-link"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M19 21H14M5 21L3 21M5 21H10M9 6.99998H10M9 11H10M14 6.99998H15M14 11H15M10 21V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V21M10 21H14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>


                    <span>Escolas</span>
                </a>

                <a href="/admin/courses" className={pathname.includes("/admin/courses") ? "menu-link selected" : "menu-link"}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 1.00012H2C1.44772 1.00012 1 1.44784 1 2.00012V16.0001C1 16.5524 1.44772 17.0001 2 17.0001H4C4.55228 17.0001 5 16.5524 5 16.0001V2.00012C5 1.44784 4.55228 1.00012 4 1.00012Z" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 1.00012H6C5.44772 1.00012 5 1.44784 5 2.00012V16.0001C5 16.5524 5.44772 17.0001 6 17.0001H8C8.55228 17.0001 9 16.5524 9 16.0001V2.00012C9 1.44784 8.55228 1.00012 8 1.00012Z" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M1 5.00012H5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M5 13.0001H9" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9.80302 1.56016L11.987 1.03016C12.549 0.895165 13.12 1.22016 13.269 1.76216L16.964 15.1802C17.0292 15.4258 17.0003 15.687 16.8831 15.9124C16.7658 16.1379 16.5686 16.3115 16.33 16.3992L16.197 16.4402L14.013 16.9702C13.451 17.1052 12.88 16.7802 12.731 16.2382L9.03602 2.82016C8.97083 2.57451 8.9997 2.31338 9.11697 2.0879C9.23424 1.86242 9.43146 1.68884 9.67002 1.60116L9.80302 1.56016V1.56016Z" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 6.00012L14 5.00012" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 13.0001L15.923 12.0201" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>

                    <span>Biblioteca</span>
                </a>

                <a href="/admin/certificates" className={pathname.includes("/admin/certificates") ? "menu-link selected" : "menu-link"}>
                    <svg height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.7495 18.8997C17.4892 18.8997 18.8994 17.4894 18.8994 15.7498C18.8994 14.0101 17.4892 12.5999 15.7495 12.5999C14.0099 12.5999 12.5996 14.0101 12.5996 15.7498C12.5996 17.4894 14.0099 18.8997 15.7495 18.8997Z" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M13.6504 18.3743V23.0991L15.7503 21.5242L17.8503 23.0991V18.3743" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10.5002 19.9493H5.25033C4.69339 19.9493 4.15926 19.7281 3.76545 19.3342C3.37163 18.9404 3.15039 18.4063 3.15039 17.8494V7.34969C3.15039 6.19473 4.09536 5.24976 5.25033 5.24976H19.9499C20.5068 5.24976 21.0409 5.471 21.4347 5.86481C21.8286 6.25863 22.0498 6.79275 22.0498 7.34969V17.8494C22.0494 18.2176 21.9522 18.5793 21.7679 18.8981C21.5836 19.2169 21.3188 19.4817 20.9998 19.6658" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.29883 9.44971H18.8984" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.29883 12.5999H9.44873" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M6.29883 15.7495H8.39876" stroke="white" stroke-width="2.09993" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>

                    <span>Certificados</span>
                </a>

                <a href="/admin/communications" className={pathname.includes("/admin/communications") ? "menu-link selected" : "menu-link"}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 26 26" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M5.20102 2.40113L5.20329 2.40112H20.4106L20.4129 2.40113C21.3667 2.40384 22.2806 2.78394 22.9551 3.45838C23.6295 4.13282 24.0096 5.04678 24.0123 6.00058L24.0123 6.00285V15.6075L24.0123 15.6097C24.0096 16.5635 23.6295 17.4775 22.9551 18.1519C22.2806 18.8264 21.3667 19.2065 20.4129 19.2092L20.4106 19.2092H12.294L7.7168 23.0255C7.47824 23.2244 7.14615 23.2673 6.86486 23.1356C6.58357 23.0039 6.40387 22.7213 6.40387 22.4107V19.2092H5.20329L5.20102 19.2092C4.24722 19.2065 3.33326 18.8264 2.65882 18.1519C1.98438 17.4775 1.60428 16.5635 1.60157 15.6097L1.60156 15.6075V6.00285L1.60157 6.00058C1.60428 5.04678 1.98438 4.13282 2.65882 3.45838C3.33326 2.78394 4.24722 2.40384 5.20102 2.40113ZM12.4056 19.1162C12.4054 19.1163 12.4058 19.116 12.4056 19.1162V19.1162ZM5.20452 4.00189C4.67407 4.00368 4.16584 4.21519 3.79073 4.59029C3.41562 4.9654 3.20412 5.47363 3.20233 6.00409V15.6062C3.20412 16.1367 3.41562 16.6449 3.79073 17.02C4.16585 17.3951 4.67411 17.6067 5.20458 17.6084H7.20425C7.64629 17.6084 8.00464 17.9668 8.00464 18.4088V20.7013L11.3794 17.8876C11.3792 17.8877 11.3796 17.8874 11.3794 17.8876C11.5953 17.7075 11.868 17.6084 12.1491 17.6084C12.1491 17.6084 12.1492 17.6084 12.1491 17.6084H20.4093C20.9398 17.6067 21.448 17.3951 21.8232 17.02C22.1983 16.6449 22.4098 16.1366 22.4116 15.6062V6.00414C22.4098 5.47367 22.1983 4.96541 21.8232 4.59029C21.4481 4.21519 20.9398 4.00368 20.4094 4.00189H5.20452Z" fill="white"/>
                    </svg>
                    <span>Comunicações</span>
                </a>

                <a href="/admin/helpdesk" className={pathname.includes("/admin/helpdesk") ? "menu-link selected" : "menu-link"}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M8.5 9.5H15.5M8.5 13H12.5M7 20L3.5 21V5.5C3.5 4.67157 4.17157 4 5 4H19C19.8284 4 20.5 4.67157 20.5 5.5V16.5C20.5 17.3284 19.8284 18 19 18H9.5L7 20Z" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Helpdesk</span>
                </a>

                <a href="/admin/users" className={pathname.includes("/admin/users") ? "menu-link selected" : "menu-link"}>
                    <svg height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.4889 0C16.1828 0 15.0027 0.492533 14.1733 1.37682C13.3418 2.26346 12.9111 3.49254 13.0089 4.87201C13.1905 7.43655 15.1229 9.6203 17.4889 9.6203C19.8557 9.6203 21.7842 7.43499 21.9688 4.87299C22.1693 2.09557 20.1625 0 17.4889 0ZM15.4492 2.57337C14.9775 3.07634 14.6875 3.8151 14.7536 4.74829C14.8869 6.63092 16.2582 7.87116 17.4889 7.87116C18.7187 7.87116 20.0884 6.63135 20.2242 4.74731C20.3516 2.98358 19.1476 1.74915 17.4889 1.74915C16.6287 1.74915 15.9231 2.06805 15.4492 2.57337Z" fill="white"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.79429 17.2476C9.78571 13.2674 13.6967 11.3694 17.4889 11.3694C21.2734 11.3694 25.1932 13.2067 26.1847 17.2504C26.4013 18.1315 25.8539 19.2406 24.6948 19.2406H10.2835C9.12755 19.2406 8.57334 18.134 8.79429 17.2476ZM10.5394 17.4915H24.4398C23.6435 14.6464 20.7629 13.1186 17.4889 13.1186C14.2256 13.1186 11.3384 14.6921 10.5394 17.4915Z" fill="white"/>
                        <path d="M7.16062 9.83348C5.23656 9.83348 3.54754 8.04607 3.38902 5.84871C3.30703 4.72269 3.65686 3.68414 4.36745 2.91889C5.07258 2.16457 6.06194 1.74915 7.15515 1.74915C8.2429 1.74915 9.23226 2.17003 9.93739 2.92982C10.6534 3.70054 11.0033 4.73909 10.9213 5.85417C10.7737 8.04607 9.07921 9.83348 7.16062 9.83348ZM7.16062 3.49283C6.55935 3.49283 6.02367 3.71147 5.65198 4.11049C5.26936 4.52045 5.08897 5.07799 5.13817 5.72299C5.23109 7.00205 6.15486 8.08433 7.16062 8.08433C8.16638 8.08433 9.09561 7.00205 9.18307 5.72299C9.2268 5.09439 9.04095 4.52591 8.66379 4.11596C8.2921 3.71147 7.75642 3.49283 7.16062 3.49283Z" fill="white"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.0425228 15.6811C0.861749 12.3944 4.08578 10.8529 7.15799 10.8529C8.39522 10.8529 9.6147 11.0393 10.7473 11.5582C11.1864 11.7594 11.3793 12.2785 11.1781 12.7176C10.9769 13.1567 10.4578 13.3496 10.0187 13.1484C9.17801 12.7633 8.22417 12.602 7.15799 12.602C4.69101 12.602 2.54461 13.7474 1.8477 15.7423H7.54062C8.02363 15.7423 8.41519 16.1339 8.41519 16.6169C8.41519 17.0999 8.02363 17.4915 7.54062 17.4915H1.4033C0.341849 17.4915 -0.154409 16.476 0.0422233 15.6823L0.0425228 15.6811Z" fill="white"/>
                    </svg>

                    <span>Usuários</span>
                </a>

                <a href="/admin/reports-center" className={pathname.includes("/admin/reports-center") ? "menu-link selected" : "menu-link"}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V5.5Z" stroke="white" stroke-width="1.8"/>
                        <path d="M8 9H16" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M8 13H16" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                        <path d="M8 17H13" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
                      </svg>
                    <span>Relatórios</span>
                </a>

                <a href="/admin/agenda" className={pathname.includes("/admin/agenda") ? "menu-link selected" : "menu-link"}>
                    <svg height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 4.5C3.67157 4.5 3 5.17157 3 6V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V6C21 5.17157 20.3284 4.5 19.5 4.5H4.5ZM1.5 6C1.5 4.34315 2.84315 3 4.5 3H19.5C21.1569 3 22.5 4.34315 22.5 6V19.5C22.5 21.1569 21.1569 22.5 19.5 22.5H4.5C2.84315 22.5 1.5 21.1569 1.5 19.5V6Z" fill="white"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6 1.5C6.41421 1.5 6.75 1.83579 6.75 2.25V3.75C6.75 4.16421 6.41421 4.5 6 4.5C5.58579 4.5 5.25 4.16421 5.25 3.75V2.25C5.25 1.83579 5.58579 1.5 6 1.5Z" fill="white"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M18 1.5C18.4142 1.5 18.75 1.83579 18.75 2.25V3.75C18.75 4.16421 18.4142 4.5 18 4.5C17.5858 4.5 17.25 4.16421 17.25 3.75V2.25C17.25 1.83579 17.5858 1.5 18 1.5Z" fill="white"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 7.5C1.5 7.08579 1.83579 6.75 2.25 6.75H21.75C22.1642 6.75 22.5 7.08579 22.5 7.5C22.5 7.91421 22.1642 8.25 21.75 8.25H2.25C1.83579 8.25 1.5 7.91421 1.5 7.5Z" fill="white"/>
                    </svg>

                    <span>Agenda</span>
                </a>

                <PageSelector/>


                <a href="/admin/logs" className="menu-link config">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 16 16" fill="none">
                        <path d="M8 5.33325C11.3137 5.33325 14 4.43782 14 3.33325C14 2.22868 11.3137 1.33325 8 1.33325C4.68629 1.33325 2 2.22868 2 3.33325C2 4.43782 4.68629 5.33325 8 5.33325Z" stroke="#ffffff" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 3.33325V12.6666C2 13.197 2.63214 13.7057 3.75736 14.0808C4.88258 14.4559 6.4087 14.6666 8 14.6666C9.5913 14.6666 11.1174 14.4559 12.2426 14.0808C13.3679 13.7057 14 13.197 14 12.6666V3.33325" stroke="#ffffff" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 8C2 8.53043 2.63214 9.03914 3.75736 9.41421C4.88258 9.78929 6.4087 10 8 10C9.5913 10 11.1174 9.78929 12.2426 9.41421C13.3679 9.03914 14 8.53043 14 8" stroke="#ffffff" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>

                    <span>Logs</span>
                </a>

                <button id="logout" onClick={doLogout}>
                    <svg height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.6277 19.1415V21.0947C17.6277 23.2487 15.8754 25.0011 13.7213 25.0011L3.90642 25.0011C1.75236 25.0011 0 23.2487 0 21.0947L0 3.90642C0 1.75236 1.75236 0 3.90642 0L13.7213 0C15.8754 0 17.6277 1.75236 17.6277 3.90642V5.85963C17.6277 6.39905 17.1905 6.83624 16.6511 6.83624C16.1117 6.83624 15.6745 6.39905 15.6745 5.85963V3.90642C15.6745 2.82949 14.7982 1.95321 13.7213 1.95321L3.90642 1.95321C2.82949 1.95321 1.95321 2.82949 1.95321 3.90642L1.95321 21.0947C1.95321 22.1716 2.82949 23.0479 3.90642 23.0479L13.7213 23.0479C14.7982 23.0479 15.6745 22.1716 15.6745 21.0947L15.6745 19.1415C15.6745 18.602 16.1117 18.1649 16.6511 18.1649C17.1905 18.1649 17.6277 18.602 17.6277 19.1415ZM24.286 10.823L22.0991 8.63609C21.7176 8.2546 21.0993 8.2546 20.718 8.63609C20.3365 9.01739 20.3365 9.63578 20.718 10.0171L22.2735 11.5728L10.5473 11.5728C10.0079 11.5728 9.57073 12.01 9.57073 12.5494C9.57073 13.0888 10.0079 13.526 10.5473 13.526L22.2735 13.526L20.718 15.0817C20.3365 15.463 20.3365 16.0814 20.718 16.4627C20.9087 16.6534 21.1586 16.7488 21.4084 16.7488C21.6585 16.7488 21.9084 16.6534 22.0991 16.4627L24.286 14.2758C25.238 13.3238 25.238 11.775 24.286 10.823Z" fill="white"/>
                    </svg>
                </button>

                

            </div>
        </div>
    )
}

export default Menubar
