import React, { useState } from "react";
import { authenticate } from "../controllers/user/authenticate.controller";
import { setCookie } from "../controllers/misc/cookies.controller";

import Footer from "../components/footer";

import paxIconImg from "../img/pax-icon.svg";

import "../style/auth.css";

type modalData = {
    isError: boolean,
    message: string
}

function Login() {
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);

    function handleModalMessage(data: modalData) {
        const isError = data.isError;
        const message = data.message;
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(isError);
        messageElement.textContent = message;
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = (document.getElementById("emailEl") as HTMLInputElement).value;
        const password = (document.getElementById("passwordEl") as HTMLInputElement).value;
        await authenticate(email, password)
                .then((data) => {
                    if (data.success) {
                        console.log("Login successful:", data);
                        setCookie({ name: "authToken", value: data.token });
                        setCookie({ name: "userData", value: JSON.stringify(data.user) });
                        window.location.href = "/dashboard";
                    } else {
                        console.error("Login failed:", data.message);
                        handleModalMessage({
                            isError: true,
                            message: data.message || "Login failed"
                        })
                    }
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                    handleModalMessage({
                        isError: true,
                        message: error.response?.data?.message || "An error occurred during login"
                    })
                });
    };

    return (
        <React.Fragment>
            <div className="auth-container">
                <div className="auth-wrapper login">
                    <div className="header-wrapper">
                        <img src={paxIconImg} alt="logo pax" />
                        <b>Login</b>
                    </div>
                    <form className="form-wrapper" onSubmit={handleLogin}>
                        <div className="input-wrapper">
                            <span>E-mail</span>
                            <input type="email" name="email" id="emailEl" />
                        </div>
                        <div className="input-wrapper">
                            <span>Senha</span>
                            <input type="password" name="password" id="passwordEl" />
                        </div>
                        <div className="forgot-pass-wrapper">
                            <a href="/forgot-password">Esqueci a senha</a>
                        </div>
                        <div className="button-wrapper login">
                            <button type="submit">Entrar</button>
                        </div>
                    </form>
                    <a href="/terms-and-conditions" className="bottom-link">Termos de uso</a>
                </div>
            </div>

            <Footer/>

            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">Dados inválidos</span>
            </div>
        </React.Fragment>
    )
}

export default Login;