import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';

import "./Page.css"

import { useAlert } from "../../context/AlertContext";
import { useScrollLock } from "../../hooks/useScrollLock";
import LoginForm from "../../components/FormLogin"

import { ASSETS } from "../../config/assets";

const Login = () => {
    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const [errorTop, setErrorTop] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const shownRef = useRef(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const error = params.get("error");

        if (location.state?.success) {
            showAlert(
                "success",
                location.state.success,
                "login-success"
            );
        }

        if (error === "expired") {
            showAlert(
                "error",
                "Ověření e-mailu vypršelo. Registrujte se prosím znovu.",
                "verify-expired"
            );
        }

        if (error === "invalid") {
            showAlert(
                "error",
                "Neplatný nebo již použitý ověřovací odkaz.",
                "verify-invalid"
            );
        }

        if (error) {
            params.delete("error");
            navigate(
                { pathname: location.pathname, search: params.toString() },
                { replace: true }
            );
        }
    }, [location.search, location.pathname, navigate, showAlert, location.state]);

    return (
        <>
            <div className="login_page">
                <div className="login_page_child">
                    <img className="login_logo" alt="logo" src={ASSETS.logo_top} />
                    <div className="login_section">
                        <h2 className="strong">PŘIHLÁŠENÍ</h2>
                        {errorTop && <div className="error_all error_all_center"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text strong" dangerouslySetInnerHTML={{ __html: errorTop }} /><FontAwesomeIcon icon={faCircleXmark} className="error_icon_right" /></div>}
                        <LoginForm setLoading={setLoading} setErrorTop={setErrorTop}></LoginForm>
                        <div className="oauth_divider"><span className="body_base">nebo</span></div>
                        <div className="oauth_container">
                            <button className="oauth_button" onClick={() => window.location.href = "http://127.0.0.1:8000/auth/google/redirect"}>
                                <FontAwesomeIcon icon={faGoogle} className="oauth_icon" /><p className="oauth_text strong">Pokračovat přes Google</p>
                            </button>
                            <button className="oauth_button" onClick={() => window.location.href = "http://127.0.0.1:8000/auth/facebook/redirect"}>
                                <FontAwesomeIcon icon={faFacebookF} className="oauth_icon" /><p className="oauth_text strong">Pokračovat přes Facebook</p>
                            </button>
                        </div>
                    </div>
                </div>
                <p className="login_link">Ještě nemáš účet?
                    <a href="./Register" className="login_a strong"> Zaregistruj se!</a>
                </p>

            </div>

        </>
    )
}

export default Login
