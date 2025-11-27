import React from "react";

import hugIconImg from "../img/hug-icon.svg";

import "../style/footer.css";

function Footer() {
    return (
        <div className="footer-wrapper">
            <span>Um produto</span>
            <img src={hugIconImg} alt="" />
        </div>
    )
}

export default Footer;