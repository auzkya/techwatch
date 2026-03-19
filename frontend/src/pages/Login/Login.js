import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { faFacebookF, faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Page.css";

import { Link } from "react-router-dom";
import LoginForm from "../../components/FormLogin";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";
import { ROUTES } from "../../routes/RouteNames";

import { ASSETS } from "../../config/assets";

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { user, isAuthReady } = useAuth();
    useScrollLock(loading);
    const [errorTop, setErrorTop] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert } = useAlert();

    useEffect(() => {
        if (!isAuthReady) {
            setLoading(true);
        } else {
            setLoading(false);

            if (user) {
                //  jestli máme v state uloženou cestu "odkud"
                const origin = location.state?.from?.pathname || ROUTES.HOME;
                navigate(origin, { replace: true });
            }
        }
    }, [isAuthReady, user, navigate, location.state?.from?.pathname]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const error = params.get("error");
        const reason = params.get("reason"); // důvod banu, pokud existuje

        if (location.state?.success) {
            showAlert("success", location.state.success, "login-success");
        }

        if (error === "expired") {
            showAlert(
                "error",
                "Ověření e-mailu vypršelo. Registrujte se prosím znovu.",
                "verify-expired",
            );
        }

        if (error === "invalid") {
            showAlert(
                "error",
                "Neplatný nebo již použitý ověřovací odkaz.",
                "verify-invalid",
            );
        }

        if (error === "banned") {
            // Pokud reason existuje, přidáme ho k textu
            const message = reason
                ? `Váš účet byl zablokován. Důvod: ${decodeURIComponent(reason)}`
                : "Váš účet byl zablokován pro porušení pravidel.";

            showAlert("error", message, "auth-banned");
        }

        if (error === "deleted") {
            showAlert(
                "error",
                "Tento účet byl zrušen. Pokud si ho přejete obnovit, kontaktujte podporu.",
                "auth-banned",
            );
        }

        if (error) {
            params.delete("error");
            navigate(
                { pathname: location.pathname, search: params.toString() },
                { replace: true },
            );
        }
    }, [
        location.search,
        location.pathname,
        navigate,
        showAlert,
        location.state,
    ]);

    if (!isAuthReady || user) return null;

    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    return (
        <>
            <div className="login_page">
                <div className="login_page_child">
                    <img
                        className="login_logo"
                        alt="logo"
                        src={ASSETS.logo_top}
                    />
                    <div className="login_section">
                        <h2 className="strong">PŘIHLÁŠENÍ</h2>
                        {errorTop && (
                            <div className="error_all error_all_center">
                                <FontAwesomeIcon
                                    icon={faCircleXmark}
                                    className="error_icon"
                                />
                                <p
                                    className="error_text strong"
                                    dangerouslySetInnerHTML={{
                                        __html: errorTop,
                                    }}
                                />
                                <FontAwesomeIcon
                                    icon={faCircleXmark}
                                    className="error_icon_right"
                                />
                            </div>
                        )}
                        <LoginForm
                            setLoading={setLoading}
                            setErrorTop={setErrorTop}
                        ></LoginForm>
                        <div className="oauth_divider">
                            <span className="body_base">nebo</span>
                        </div>
                        <div className="oauth_container">
                            <button
                                className="oauth_button"
                                onClick={() => {
                                    const origin =
                                        location.state?.from?.pathname ||
                                        "/app";
                                    window.location.href = `${apiUrl}/auth/google/redirect?redirect=${encodeURIComponent(origin)}`;
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faGoogle}
                                    className="oauth_icon"
                                />
                                <p className="oauth_text strong">
                                    Pokračovat přes Google
                                </p>
                            </button>
                            <button
                                className="oauth_button"
                                onClick={() => {
                                    const origin =
                                        location.state?.from?.pathname ||
                                        "/app";
                                    window.location.href = `${apiUrl}/auth/facebook/redirect?redirect=${encodeURIComponent(origin)}`;
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={faFacebookF}
                                    className="oauth_icon"
                                />
                                <p className="oauth_text strong">
                                    Pokračovat přes Facebook
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
                <p className="login_link">
                    Ještě nemáte účet?
                    <Link to={ROUTES.REGISTER} className="login_a strong">
                        {" "}
                        Zaregistrujte se!
                    </Link>
                </p>

                <footer className="login-footer">
                    <Link to="/privacy" className="body_smallest">
                        Privacy Policy
                    </Link>
                </footer>
            </div>
        </>
    );
};

export default Login;
