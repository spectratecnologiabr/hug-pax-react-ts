import React from "react";

import Footer from "../components/footer";

import paxIconImg from "../img/pax-icon.svg";

import "../style/auth.css";

function ResetPassword() {
    return (
        <React.Fragment>
            <div className="auth-container">
                <div className="auth-wrapper login">
                    <div className="header-wrapper">
                        <img src={paxIconImg} alt="logo pax" />
                        <b>Login</b>
                    </div>
                    <form className="form-wrapper" onSubmit={e => e.preventDefault()}>
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
        </React.Fragment>
    )
}

export default ResetPassword;