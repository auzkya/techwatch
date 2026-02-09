import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import InputLogin from "./InputLogin";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import axiosInstance from "../api/axiosInstance";

import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

const LoginForm = ({ setLoading, setError, setErrorTop }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const togglePassword = () => setShowPassword(!showPassword);
    const { showAlert } = useAlert();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorTop("");

        try {
            await loginUser(email, password); // předáme email + password
            navigate("/", { replace: true });
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
                    <span className="password-toggle-icon" onClick={togglePassword}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></span>
                </div>
            </div>

            <div className="reset_password_link">
                <p className="error_text"><a className="login_a" href="/forgot-password">Zapomenuté heslo?</a></p>
            </div>

            <button type="submit" className="form-submit" disabled={false}>
                <p className="strong">Přihlásit se</p>
            </button>
        </form>
    );
};

export default LoginForm;
