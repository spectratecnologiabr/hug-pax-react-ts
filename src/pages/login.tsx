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
                            <div>
                                <input type={!passwordView ? "password" : "text"} name="password" id="passwordEl" />
                                <label htmlFor="passChanger" className="passIcon">
                                    {
                                        !passwordView ?
                                            <svg width="20" height="19" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M23.3524 9.09982C22.5721 7.96388 21.6431 6.93756 20.5903 6.04831L23.431 3.20857C24.0047 2.60125 23.9774 1.64389 23.3701 1.07027C22.7865 0.519053 21.874 0.519715 21.2912 1.07173L18.0178 4.34608C16.2359 3.45565 14.2688 2.99888 12.2768 3.01292C7.79773 3.05579 3.63849 5.34158 1.2013 9.09982C-0.0802834 10.9847 -0.0802834 13.4611 1.2013 15.346C1.98158 16.482 2.91053 17.5083 3.96338 18.3975L1.12264 21.2403C0.531721 21.8312 0.531721 22.7892 1.12264 23.3801C1.71356 23.971 2.67163 23.971 3.26251 23.3801L6.53586 20.1058C8.31779 20.9962 10.2849 21.453 12.2768 21.4389C16.7559 21.3962 20.9152 19.1103 23.3524 15.3521C24.6367 13.4659 24.6367 10.986 23.3524 9.09982ZM3.69616 13.6377C3.11545 12.7861 3.11545 11.6658 3.69616 10.8142C5.55567 7.86405 8.78964 6.06405 12.2768 6.03824C13.452 6.03253 14.6187 6.23749 15.7216 6.6433L13.852 8.51193C11.8014 7.64141 9.43331 8.5981 8.56284 10.6487C8.13523 11.656 8.13523 12.7938 8.56284 13.8011L6.10532 16.2597C5.17822 15.5083 4.36654 14.6249 3.69616 13.6377ZM20.8575 13.6377C18.998 16.5879 15.764 18.3878 12.2768 18.4137C11.1017 18.4194 9.93494 18.2144 8.83204 17.8086L10.7017 15.939C12.7523 16.8095 15.1204 15.8528 15.9908 13.8022C16.4184 12.7949 16.4184 11.6571 15.9908 10.6498L18.4484 8.19229C19.3754 8.94364 20.1871 9.82703 20.8575 10.8142C21.4382 11.6658 21.4382 12.7861 20.8575 13.6377Z" fill="#374957"></path>
                                            </svg>
                                        :
                                            <svg width="20" height="14" viewBox="0 0 25 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M23.2257 6.15139C20.7897 2.39284 16.6306 0.106901 12.1518 0.0648804C7.67305 0.106901 3.51401 2.39284 1.07795 6.15139C-0.205832 8.03542 -0.205832 10.5132 1.07795 12.3972C3.51263 16.1581 7.67192 18.4464 12.1519 18.4898C16.6306 18.4478 20.7897 16.1618 23.2258 12.4033C24.5122 10.5178 24.5122 8.03679 23.2257 6.15139ZM20.733 10.689C18.8732 13.639 15.6391 15.4388 12.1518 15.4647C8.66458 15.4389 5.4305 13.639 3.57058 10.689C2.99076 9.8372 2.99076 8.71743 3.57058 7.86563C5.43046 4.91564 8.66453 3.11584 12.1518 3.08998C15.639 3.11579 18.8731 4.91564 20.733 7.86563C21.3129 8.71743 21.3129 9.8372 20.733 10.689Z" fill="#374957"></path>
                                                <path d="M12.1521 13.3106C14.3797 13.3106 16.1856 11.5048 16.1856 9.27717C16.1856 7.04955 14.3797 5.24371 12.1521 5.24371C9.92449 5.24371 8.11865 7.04955 8.11865 9.27717C8.11865 11.5048 9.92449 13.3106 12.1521 13.3106Z" fill="#374957"></path>
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