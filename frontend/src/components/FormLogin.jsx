import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InputLogin from "./InputLogin";

import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

import { ROUTES } from "../routes/RouteNames";

const LoginForm = ({ setLoading, setError, setErrorTop }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const togglePassword = () => setShowPassword(!showPassword);
    const { showAlert } = useAlert();

    const SENSITIVE_PATHS = [
        ROUTES.ADMIN,
        "/tech/edit", // Stačí začátek cesty
        ROUTES.ADD_TECH,
        ROUTES.EDIT_PROFILE,
        ROUTES.FAVOURITES,
        ROUTES.FAVOURITES_CATEGORY,
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorTop("");

        try {
            await loginUser(email, password); // předáme email + password
            // Zjistíme, odkud uživatel přišel
            const origin = location.state?.from?.pathname || "/app"; // Pokud není informace o původu, přesměrujeme na home

            // Kontrola, zda původní cesta nezačíná některou z citlivých cest
            const isSensitive = SENSITIVE_PATHS.some((path) =>
                origin.startsWith(path),
            );

            if (isSensitive || origin === ROUTES.LOGIN) {
                // Pokud je cesta citlivá, pošli ho raději na základní HOME
                navigate(ROUTES.HOME, { replace: true });
            } else {
                // Jinak ho klidně vrať tam, kde byl (např. detail veřejné techniky)
                navigate(origin, { replace: true });
            }
        } catch (err) {
            console.error(err); // <--- vypiš celý objekt, abys viděl status a message
            if (err.response) {
                const message = err.response.data.message || "Chyba přihlášení";
                setErrorTop(message);
            } else {
                setErrorTop("Chyba sítě nebo serveru");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            <InputLogin
                type="email"
                name="email"
                placeholder="Email"
                required
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
            />

            <div className="password-wrapper">
                <div className="password-field">
                    <InputLogin
                        type={showPassword ? "text" : "password"}
                        placeholder="Heslo"
                        autoComplete="new-password"
                        required
                        value={password || ""}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                        className="password-toggle-icon"
                        onClick={togglePassword}
                    >
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                        />
                    </span>
                </div>
            </div>

            <div className="reset_password_link">
                <p className="error_text">
                    <a className="login_a" href="/forgot-password">
                        Zapomenuté heslo?
                    </a>
                </p>
            </div>

            <button type="submit" className="form-submit" disabled={false}>
                <p className="strong">Přihlásit se</p>
            </button>
        </form>
    );
};

export default LoginForm;
