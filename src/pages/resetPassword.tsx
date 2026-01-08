import React, { useState } from "react";
import resetPassword from "../controllers/user/resetPassword.controller";

import Footer from "../components/footer";

import paxIconImg from "../img/pax-icon.svg";

import "../style/auth.css";

function ResetPassword() {
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token') as string;

    console.log(token);

    async function sendNewPassword(e: React.FormEvent) {
        e.preventDefault();
        const password = (document.getElementById("passwordEl") as HTMLInputElement).value;
        const confirmPassword = (document.getElementById("confirmPasswordEl") as HTMLInputElement).value;

        if(password !== confirmPassword) {
            setMessage(`Senha e confirmação de senha não conferem.`);
            setIsError(true);
            setModalErrorOpen(true);

            setTimeout(() => {
                setModalErrorOpen(false);
            }, 5000)
        } else {
            await resetPassword(token, password)
                    .then(response => {
                        if(response.message) {
                            setMessage(`Sua senha foi alterada com sucesso!`);
                            setIsError(false);
                            setModalErrorOpen(true);

                            setTimeout(() => {
                                setModalErrorOpen(false);
                                window.location.pathname = "/login"
                            }, 5000)
                        }
                    })
        }
    }

    return (
        <React.Fragment>
            <div className="auth-container">
                <div className="auth-wrapper login">
                    <div className="header-wrapper">
                        <img src={paxIconImg} alt="logo pax" />
                        <b>Login</b>
                    </div>
                    <form className="form-wrapper" onSubmit={sendNewPassword}>
                        <div className="input-wrapper">
                            <span>Senha</span>
                            <input type="password" name="password" id="passwordEl" />
                        </div>
                        <div className="input-wrapper">
                            <span>Confirmar senha</span>
                            <input type="password" name="confirmPassword" id="confirmPasswordEl" />
                        </div>
                        <div className="button-wrapper">
                            <button type="submit">Entrar</button>
                        </div>
                    </form>
                    <a href="/terms-and-conditions" className="bottom-link">Termos de uso</a>
                </div>
            </div>

            <Footer />

            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    )
}

export default ResetPassword;