import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { ROUTES, buildRoute } from "../routes/RouteNames";

import InputLogin from "./InputLogin";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';


const ResetPasswordForm = ({ setLoading, setSuccess, setError, setErrorTop }) => {
    const [searchParams] = useSearchParams();
    const { token } = useParams(); // token se bere z URL path /reset-password?token={{ $token }}&email={{ urlencode($email)
    const navigate = useNavigate();

    const [email, setEmail] = useState(searchParams.get("email") || ""); // email se bere z URL path /reset-password?token={{ $token }}&email={{ urlencode($email)
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        if (!email || !token) {
            setError(
                "<span class='message_container_text_bigger'>Neplatný odkaz pro reset hesla</span><br />Zkontroluj prosím, zda používáš aktuální odkaz z e-mailu."
            );
        }
    }, [email, token, setError]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        if (password.length < 8) {
            setError("<span class='message_container_text_bigger'>Heslo musí mít alespoň 8 znaků</span>");
            setLoading(false);
            return;
        }

        if (password !== passwordConfirm) {
            setError("<span class='message_container_text_bigger'>Hesla se neshodují</span>");
            setLoading(false);
            return;
        }

        const data = {
            email,
            token,
            password,
            password_confirmation: passwordConfirm
        };

        try {
            await axiosInstance.post("/api/password-reset", data);

            // Úspěch
            navigate(buildRoute(ROUTES.LOGIN), {
                state: {
                    success: "Heslo bylo úspěšně změněno. Nyní se můžeš přihlásit."
                }
            });
        } catch (err) {
            console.error(err);

            const responseData = err.response?.data;
            const msg =
                responseData?.message ||
                Object.values(responseData?.errors || {}).flat().join("<br />") ||
                "Nepodařilo se obnovit heslo";

            setErrorTop(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            <div className="password-wrapper">
                <div className="password-field">
                    <InputLogin
                        type={showPassword ? "text" : "password"} // typ inputu se mění na základě skrytí hesla
                        placeholder="Heslo"
                        autoComplete="new-password"
                        required
                        value={password || ""}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span class="password-toggle-icon" onClick={togglePassword}><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></span>
                    {password.length > 0 && password.length < 8 && (
                        <div className="error_all"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text">Heslo musí obsahovat minimálně 8 znaků</p></div>
                    )}</div>
            </div>
            <InputLogin
                type="password"
                placeholder="Heslo znovu"
                required
                value={passwordConfirm || ""}
                onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {password && passwordConfirm && password !== passwordConfirm && (
                <div className="error_all"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text">Hesla se neshodují</p></div>
            )}

            <button type="submit" className="form-submit extra_space"><p className="strong">Vytvořit nové heslo</p></button>
        </form>
    );
};

export default ResetPasswordForm;
