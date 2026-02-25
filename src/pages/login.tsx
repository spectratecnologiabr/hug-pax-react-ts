import React, { useState } from "react";
import { authenticate } from "../controllers/user/authenticate.controller";
import { removeCookies, setCookie } from "../controllers/misc/cookies.controller";

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
    const [passwordView, setPasswordView] = useState(false)

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
                        const { profilePic, ...userWithoutPic } = data.user;

                        console.log(profilePic)
                        
                        setCookie({ name: "authToken", value: data.token });
                        setCookie({ name: "userData", value: JSON.stringify(userWithoutPic) });
                        localStorage.setItem("profilePic", profilePic);

                        if (userWithoutPic?.mustChangePassword) {
                            window.location.href = "/profile?forcePassword=1";
                            return;
                        }

                        if (userWithoutPic?.termsPending) {
                            window.location.href = "/terms-acceptance";
                            return;
                        }

                        // Redireciona conforme o role
                        let redirectUrl = "/dashboard";
                        if (userWithoutPic.role === "consultant") {
                            redirectUrl = "/consultant";
                        } else if (userWithoutPic.role === "coordinator") {
                            redirectUrl = "/coordinator";
                        } else if (userWithoutPic.role === "admin") {
                            redirectUrl = "/admin";
                        } else if (userWithoutPic.role === "educator") {
                            redirectUrl = "/dashboard";
                        }
                        window.location.href = redirectUrl;
                    } else {
                        if (data?.code === "VACATION_MODE") {
                            removeCookies("authToken");
                            removeCookies("userData");
                            window.location.href = `/consultant/vacation?message=${encodeURIComponent(data.message || "Aproveite seu descanso, nos vemos na volta!")}`;
                            return;
                        }
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
                            <div>
                                <input type={!passwordView ? "password" : "text"} name="password" id="passwordEl" />
                                <label htmlFor="passChanger" className="passIcon">
                                    {
                                        !passwordView ?
                                            <svg width="20" viewBox="0 0 22 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 0C6 0 1.73 3.11 0 7.5C1.73 11.89 6 15 11 15C16 15 20.27 11.89 22 7.5C20.27 3.11 16 0 11 0ZM11 12.5C8.24 12.5 6 10.26 6 7.5C6 4.74 8.24 2.5 11 2.5C13.76 2.5 16 4.74 16 7.5C16 10.26 13.76 12.5 11 12.5ZM11 4.5C9.34 4.5 8 5.84 8 7.5C8 9.16 9.34 10.5 11 10.5C12.66 10.5 14 9.16 14 7.5C14 5.84 12.66 4.5 11 4.5Z" fill="#323232"/>
                                            </svg>

                                        :
                                            <svg width="20" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11 4C13.76 4 16 6.24 16 9C16 9.65 15.87 10.26 15.64 10.83L18.56 13.75C20.07 12.49 21.26 10.86 21.99 9C20.26 4.61 15.99 1.5 10.99 1.5C9.59 1.5 8.25 1.75 7.01 2.2L9.17 4.36C9.74 4.13 10.35 4 11 4ZM1 1.27L3.28 3.55L3.74 4.01C2.08 5.3 0.78 7.02 0 9C1.73 13.39 6 16.5 11 16.5C12.55 16.5 14.03 16.2 15.38 15.66L15.8 16.08L18.73 19L20 17.73L2.27 0L1 1.27ZM6.53 6.8L8.08 8.35C8.03 8.56 8 8.78 8 9C8 10.66 9.34 12 11 12C11.22 12 11.44 11.97 11.65 11.92L13.2 13.47C12.53 13.8 11.79 14 11 14C8.24 14 6 11.76 6 9C6 8.21 6.2 7.47 6.53 6.8ZM10.84 6.02L13.99 9.17L14.01 9.01C14.01 7.35 12.67 6.01 11.01 6.01L10.84 6.02Z" fill="#323232"/>
                                            </svg>

                                    }
                                    
                                </label>
                                <input id="passChanger" type="checkbox" name="passChanger" style={{ display: "none" }} checked={passwordView} onChange={() => setPasswordView(!passwordView)}></input>
                            </div>
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
