import React from "react";
import { getCookies } from "../../controllers/misc/cookies.controller";
import { doLogout } from "../../controllers/user/logout.controller";
import PageSelector from "../pageSelector";

import paxIconWhite from "../../img/pax-icon-white.svg";
import homeIcon from "../../img/menu/home.svg";

import "../../style/menubar.css";

function CoordinatorMenubar() {
  const userName = getCookies("userData")?.firstName ?? "";
  const pathname = window.location.pathname;

  return (
    <div className="admin-menubar admin-menubar-hover-labels">
      <div className="logo-wrapper">
        <img src={paxIconWhite} className="pax-logo" alt="PAX" />
        <b>Olá {userName}!</b>
      </div>

      <div className="menu-wrapper">
        <a href="/coordinator" className={pathname === "/coordinator" ? "menu-link selected" : "menu-link"}>
          <img src={homeIcon} alt="" />
          <span>Início</span>
        </a>

        <a href="/coordinator/performance" className={pathname.includes("/coordinator/performance") ? "menu-link selected" : "menu-link"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 18L9 12L13 15L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 12V7H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Performance</span>
        </a>

        <a href="/coordinator/agenda" className={pathname.includes("/coordinator/agenda") ? "menu-link selected" : "menu-link"}>
          <svg height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4.5 4.5C3.67157 4.5 3 5.17157 3 6V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V6C21 5.17157 20.3284 4.5 19.5 4.5H4.5ZM1.5 6C1.5 4.34315 2.84315 3 4.5 3H19.5C21.1569 3 22.5 4.34315 22.5 6V19.5C22.5 21.1569 21.1569 22.5 19.5 22.5H4.5C2.84315 22.5 1.5 21.1569 1.5 19.5V6Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M6 1.5C6.41421 1.5 6.75 1.83579 6.75 2.25V3.75C6.75 4.16421 6.41421 4.5 6 4.5C5.58579 4.5 5.25 4.16421 5.25 3.75V2.25C5.25 1.83579 5.58579 1.5 6 1.5Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M18 1.5C18.4142 1.5 18.75 1.83579 18.75 2.25V3.75C18.75 4.16421 18.4142 4.5 18 4.5C17.5858 4.5 17.25 4.16421 17.25 3.75V2.25C17.25 1.83579 17.5858 1.5 18 1.5Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M1.5 7.5C1.5 7.08579 1.83579 6.75 2.25 6.75H21.75C22.1642 6.75 22.5 7.08579 22.5 7.5C22.5 7.91421 22.1642 8.25 21.75 8.25H2.25C1.83579 8.25 1.5 7.91421 1.5 7.5Z" fill="white"/>
          </svg>
          <span>Agenda</span>
        </a>

        <a href="/coordinator/consultants" className={pathname.includes("/coordinator/consultants") ? "menu-link selected" : "menu-link"}>
          <svg height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M17.4889 0C16.1828 0 15.0027 0.492533 14.1733 1.37682C13.3418 2.26346 12.9111 3.49254 13.0089 4.87201C13.1905 7.43655 15.1229 9.6203 17.4889 9.6203C19.8557 9.6203 21.7842 7.43499 21.9688 4.87299C22.1693 2.09557 20.1625 0 17.4889 0ZM15.4492 2.57337C14.9775 3.07634 14.6875 3.8151 14.7536 4.74829C14.8869 6.63092 16.2582 7.87116 17.4889 7.87116C18.7187 7.87116 20.0884 6.63135 20.2242 4.74731C20.3516 2.98358 19.1476 1.74915 17.4889 1.74915C16.6287 1.74915 15.9231 2.06805 15.4492 2.57337Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M8.79429 17.2476C9.78571 13.2674 13.6967 11.3694 17.4889 11.3694C21.2734 11.3694 25.1932 13.2067 26.1847 17.2504C26.4013 18.1315 25.8539 19.2406 24.6948 19.2406H10.2835C9.12755 19.2406 8.57334 18.134 8.79429 17.2476ZM10.5394 17.4915H24.4398C23.6435 14.6464 20.7629 13.1186 17.4889 13.1186C14.2256 13.1186 11.3384 14.6921 10.5394 17.4915Z" fill="white"/>
            <path d="M7.16062 9.83348C5.23656 9.83348 3.54754 8.04607 3.38902 5.84871C3.30703 4.72269 3.65686 3.68414 4.36745 2.91889C5.07258 2.16457 6.06194 1.74915 7.15515 1.74915C8.2429 1.74915 9.23226 2.17003 9.93739 2.92982C10.6534 3.70054 11.0033 4.73909 10.9213 5.85417C10.7737 8.04607 9.07921 9.83348 7.16062 9.83348ZM7.16062 3.49283C6.55935 3.49283 6.02367 3.71147 5.65198 4.11049C5.26936 4.52045 5.08897 5.07799 5.13817 5.72299C5.23109 7.00205 6.15486 8.08433 7.16062 8.08433C8.16638 8.08433 9.09561 7.00205 9.18307 5.72299C9.2268 5.09439 9.04095 4.52591 8.66379 4.11596C8.2921 3.71147 7.75642 3.49283 7.16062 3.49283Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.0425228 15.6811C0.861749 12.3944 4.08578 10.8529 7.15799 10.8529C8.39522 10.8529 9.6147 11.0393 10.7473 11.5582C11.1864 11.7594 11.3793 12.2785 11.1781 12.7176C10.9769 13.1567 10.4578 13.3496 10.0187 13.1484C9.17801 12.7633 8.22417 12.602 7.15799 12.602C4.69101 12.602 2.54461 13.7474 1.8477 15.7423H7.54062C8.02363 15.7423 8.41519 16.1339 8.41519 16.6169C8.41519 17.0999 8.02363 17.4915 7.54062 17.4915H1.4033C0.341849 17.4915 -0.154409 16.476 0.0422233 15.6823L0.0425228 15.6811Z" fill="white"/>
          </svg>
          <span>Consultores</span>
        </a>

        <a href="/coordinator/colleges" className={pathname.includes("/coordinator/colleges") ? "menu-link selected" : "menu-link"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21L21 21M19 21H14M5 21L3 21M5 21H10M9 6.99998H10M9 11H10M14 6.99998H15M14 11H15M10 21V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V21M10 21H14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Escolas</span>
        </a>

        <a href="/coordinator/educators" className={pathname.includes("/coordinator/educators") ? "menu-link selected" : "menu-link"}>
          <svg height="20" viewBox="0 0 27 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M17.4889 0C16.1828 0 15.0027 0.492533 14.1733 1.37682C13.3418 2.26346 12.9111 3.49254 13.0089 4.87201C13.1905 7.43655 15.1229 9.6203 17.4889 9.6203C19.8557 9.6203 21.7842 7.43499 21.9688 4.87299C22.1693 2.09557 20.1625 0 17.4889 0ZM15.4492 2.57337C14.9775 3.07634 14.6875 3.8151 14.7536 4.74829C14.8869 6.63092 16.2582 7.87116 17.4889 7.87116C18.7187 7.87116 20.0884 6.63135 20.2242 4.74731C20.3516 2.98358 19.1476 1.74915 17.4889 1.74915C16.6287 1.74915 15.9231 2.06805 15.4492 2.57337Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M8.79429 17.2476C9.78571 13.2674 13.6967 11.3694 17.4889 11.3694C21.2734 11.3694 25.1932 13.2067 26.1847 17.2504C26.4013 18.1315 25.8539 19.2406 24.6948 19.2406H10.2835C9.12755 19.2406 8.57334 18.134 8.79429 17.2476ZM10.5394 17.4915H24.4398C23.6435 14.6464 20.7629 13.1186 17.4889 13.1186C14.2256 13.1186 11.3384 14.6921 10.5394 17.4915Z" fill="white"/>
            <path d="M7.16062 9.83348C5.23656 9.83348 3.54754 8.04607 3.38902 5.84871C3.30703 4.72269 3.65686 3.68414 4.36745 2.91889C5.07258 2.16457 6.06194 1.74915 7.15515 1.74915C8.2429 1.74915 9.23226 2.17003 9.93739 2.92982C10.6534 3.70054 11.0033 4.73909 10.9213 5.85417C10.7737 8.04607 9.07921 9.83348 7.16062 9.83348ZM7.16062 3.49283C6.55935 3.49283 6.02367 3.71147 5.65198 4.11049C5.26936 4.52045 5.08897 5.07799 5.13817 5.72299C5.23109 7.00205 6.15486 8.08433 7.16062 8.08433C8.16638 8.08433 9.09561 7.00205 9.18307 5.72299C9.2268 5.09439 9.04095 4.52591 8.66379 4.11596C8.2921 3.71147 7.75642 3.49283 7.16062 3.49283Z" fill="white"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.0425228 15.6811C0.861749 12.3944 4.08578 10.8529 7.15799 10.8529C8.39522 10.8529 9.6147 11.0393 10.7473 11.5582C11.1864 11.7594 11.3793 12.2785 11.1781 12.7176C10.9769 13.1567 10.4578 13.3496 10.0187 13.1484C9.17801 12.7633 8.22417 12.602 7.15799 12.602C4.69101 12.602 2.54461 13.7474 1.8477 15.7423H7.54062C8.02363 15.7423 8.41519 16.1339 8.41519 16.6169C8.41519 17.0999 8.02363 17.4915 7.54062 17.4915H1.4033C0.341849 17.4915 -0.154409 16.476 0.0422233 15.6823L0.0425228 15.6811Z" fill="white"/>
          </svg>
          <span>Educadores</span>
        </a>

        <a href="/coordinator/reports-center" className={pathname.includes("/coordinator/reports-center") ? "menu-link selected" : "menu-link"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 5.5C4 4.67157 4.67157 4 5.5 4H18.5C19.3284 4 20 4.67157 20 5.5V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V5.5Z" stroke="white" strokeWidth="1.8"/>
            <path d="M8 9H16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 13H16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 17H13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span>Relatórios</span>
        </a>

        <a href="/coordinator/certificates" className={pathname.includes("/coordinator/certificates") ? "menu-link selected" : "menu-link"}>
          <svg height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.7495 18.8997C17.4892 18.8997 18.8994 17.4894 18.8994 15.7498C18.8994 14.0101 17.4892 12.5999 15.7495 12.5999C14.0099 12.5999 12.5996 14.0101 12.5996 15.7498C12.5996 17.4894 14.0099 18.8997 15.7495 18.8997Z" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.6504 18.3743V23.0991L15.7503 21.5242L17.8503 23.0991V18.3743" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.5002 19.9493H5.25033C4.69339 19.9493 4.15926 19.7281 3.76545 19.3342C3.37163 18.9404 3.15039 18.4063 3.15039 17.8494V7.34969C3.15039 6.19473 4.09536 5.24976 5.25033 5.24976H19.9499C20.5068 5.24976 21.0409 5.471 21.4347 5.86481C21.8286 6.25863 22.0498 6.79275 22.0498 7.34969V17.8494C22.0494 18.2176 21.9522 18.5793 21.7679 18.8981C21.5836 19.2169 21.3188 19.4817 20.9998 19.6658" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.29883 9.44971H18.8984" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.29883 12.5999H9.44873" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.29883 15.7495H8.39876" stroke="white" strokeWidth="2.09993" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Certificados</span>
        </a>

        <PageSelector />

        <button id="logout" onClick={doLogout} aria-label="Sair">
          <svg height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.6277 19.1415V21.0947C17.6277 23.2487 15.8754 25.0011 13.7213 25.0011L3.90642 25.0011C1.75236 25.0011 0 23.2487 0 21.0947L0 3.90642C0 1.75236 1.75236 0 3.90642 0L13.7213 0C15.8754 0 17.6277 1.75236 17.6277 3.90642V5.85963C17.6277 6.39905 17.1905 6.83624 16.6511 6.83624C16.1117 6.83624 15.6745 6.39905 15.6745 5.85963V3.90642C15.6745 2.82949 14.7982 1.95321 13.7213 1.95321L3.90642 1.95321C2.82949 1.95321 1.95321 2.82949 1.95321 3.90642L1.95321 21.0947C1.95321 22.1716 2.82949 23.0479 3.90642 23.0479L13.7213 23.0479C14.7982 23.0479 15.6745 22.1716 15.6745 21.0947L15.6745 19.1415C15.6745 18.602 16.1117 18.1649 16.6511 18.1649C17.1905 18.1649 17.6277 18.602 17.6277 19.1415ZM24.286 10.823L22.0991 8.63609C21.7176 8.2546 21.0993 8.2546 20.718 8.63609C20.3365 9.01739 20.3365 9.63578 20.718 10.0171L22.2735 11.5728L10.5473 11.5728C10.0079 11.5728 9.57073 12.01 9.57073 12.5494C9.57073 13.0888 10.0079 13.526 10.5473 13.526L22.2735 13.526L20.718 15.0817C20.3365 15.463 20.3365 16.0814 20.718 16.4627C20.9087 16.6534 21.1586 16.7488 21.4084 16.7488C21.6585 16.7488 21.9084 16.6534 22.0991 16.4627L24.286 14.2758C25.238 13.3238 25.238 11.775 24.286 10.823Z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default CoordinatorMenubar;
