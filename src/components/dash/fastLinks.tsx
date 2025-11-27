import React from "react";

import hatImg from "../../img/menu/hat.svg";
import gearImg from "../../img/menu/gear.svg";

import "../../style/fastLinks.css";

function FastLinks() {
    return (
        <div className="fast-links-container">
            <b>Links rápidos</b>

            <div className="links-wrapper">
                <a href="#">
                    <img src={hatImg} alt="hat image" />
                    <span>Registrar atividades</span>
                    <div></div>
                </a>
                <a href="#">
                    <img src={gearImg} alt="hat image" />
                    <span>Questionario pré-teste e pós-teste</span>
                    <div></div>
                </a>
                <a href="#">
                    <img src={gearImg} alt="hat image" />
                    <span>Recursos extras</span>
                    <div></div>
                </a>
            </div>
        </div>
    )
}

export default FastLinks;