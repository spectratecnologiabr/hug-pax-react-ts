import React from "react";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import infantilImg from "../../img/dash/infantil.svg";
import medio1img from "../../img/dash/1-medio.svg";
import medio2img from "../../img/dash/2-medio.svg";
import medio3img from "../../img/dash/3-medio.svg";
import inicialImg from "../../img/dash/inicial.png";
import liga2Img from "../../img/dash/liga2.png";
import liga3Img from "../../img/dash/liga3.png";
import liga4Img from "../../img/dash/liga4.png";

import "../../style/educatorsRoom.css";


// Temporário, substituir por persistência de dados
const courses = [
    {
        title: "Educação Infantil",
        progress: 80,
        imgSource: infantilImg
    },
    {
        title: "1ª série do ensino médio",
        progress: 40,
        imgSource: medio1img
    },
    {
        title: "2ª série do ensino médio",
        progress: 50,
        imgSource: medio2img
    },
    {
        title: "3ª série do ensino médio",
        progress: 70,
        imgSource: medio3img
    },
    {
        title: "Formação Inicial",
        progress: 97,
        imgSource: inicialImg
    },
    {
        title: "Liga pela paz 2",
        progress: 45,
        imgSource: liga2Img
    },
    {
        title: "Liga pela paz 3",
        progress: 20,
        imgSource: liga3Img
    },
    {
        title: "Liga pela paz 4",
        progress: 7,
        imgSource: liga4Img
    },
];

function EducatorsRoom() {
    return (
        <div className="educators-room-container">
            <div className="header-wrapper">
                <b>Sala de educadores</b>

                <div className="filters-wrapper">
                    <div className="search-wrapper">
                        <input type="search" className="course-search" id="courseSearchInput" placeholder="Procure o curso" />
                        <button disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 21 21" fill="none">
                                <path d="M13.6999 2.34726C10.5702 -0.782421 5.47644 -0.782421 2.34675 2.34726C-0.782251 5.47762 -0.782251 10.5707 2.34675 13.7011C5.13382 16.4875 9.47453 16.786 12.6022 14.6102C12.668 14.9216 12.8186 15.2188 13.0608 15.461L17.6186 20.0188C18.2828 20.6817 19.3561 20.6817 20.0169 20.0188C20.6805 19.3553 20.6805 18.282 20.0169 17.6205L15.4591 13.0613C15.2183 12.8212 14.9204 12.6699 14.609 12.604C16.7862 9.47572 16.4877 5.13569 13.6999 2.34726ZM12.2609 12.2621C9.92435 14.5987 6.12164 14.5987 3.78574 12.2621C1.45052 9.92553 1.45052 6.12351 3.78574 3.78693C6.12164 1.45103 9.92435 1.45103 12.2609 3.78693C14.5975 6.12351 14.5975 9.92553 12.2609 12.2621Z" fill="black"/>
                            </svg>
                        </button>
                    </div>

                    <select name="courseStatus" id="courseStatusSelect">
                        <option value="">Status do curso</option>
                        <option value="notInitiated">Não iniciado</option>
                        <option value="inProgress">Em andamento</option>
                        <option value="finshed">Finalizado</option>
                    </select>

                    <select name="order" id="order  Select">
                        <option value="crescent">A - Z</option>
                        <option value="decrescent">Z - A</option>
                        <option value="progress">Progresso</option>
                    </select>
                </div>
            </div>

            <div className="grid-wrapper">
                {
                    courses.map(course => {
                        return (
                            <div className="course-item">
                                <img src={course.imgSource} className="course-img" />
                                <div className="description">
                                    <span>{course.title}</span>
                                    <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                                        <CircularProgressbar
                                            styles={buildStyles({
                                                pathColor: '#90C040',
                                                textColor: '#000000',
                                                trailColor: '#d7d7da',
                                                backgroundColor: '#3e98c7'
                                            })}
                                            value={course.progress}
                                            text={course.progress + "%"}
                                            className="course-progress"/>
                                    </div>
                                </div>
                                <a href="/course">
                                    Acessar material
                                </a>
                            </div>
                        )
                    })
                }

                
            </div>
        </div>
    )
}

export default EducatorsRoom;