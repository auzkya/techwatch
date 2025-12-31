import { useState, useEffect } from "react";
import InputLogin from "./InputLogin";

import axiosInstance from "../api/axiosInstance.js";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';

import { useAlert } from "../context/AlertContext";

const RegisterForm = ({ setLoading, setTitleText, setInfoText }) => {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [email, setEmail] = useState("");
    const [emailValid, setEmailValid] = useState(true);
    const [emailValidSpecific, setEmailValidSpecific] = useState(true);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [alreadyTried, setAlreadyTried] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const { showAlert } = useAlert();

    // Debounce, aby se API nevolalo při každém písmenu
    useEffect(() => {
        if (!email) return;

        const timeout = setTimeout(async () => {
            try {
                const res = await axiosInstance.post("/api/email-check", { email });

                setEmailValid(res.data.valid);
                setEmailValidSpecific(res.data.valid);
            } catch (err) {
                console.error(err);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [email, success]);

    useEffect(() => {
        if (countdown <= 0) return; // nic nedělej pokud countdown = 0
        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    const handleResend = async () => {
        setLoading(true);
        try {
            await axiosInstance.post("/api/resend-verification", { email });
            showAlert("success", "Potvrzovací email byl odeslán znovu.");
            setCountdown(59); // restart countdownu
        } catch (err) {
            console.error(err);
            showAlert("error", "Chyba při odesílání potvrzovacího emailu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // pokud existují chyby, formulář vůbec neodesílej
        if (!emailValid || password.length < 8 || password !== passwordConfirm) {
            return;
        }

        setSuccess("");
        setLoading(true);

        if (!emailValidSpecific) {
            showAlert("error", "Tento e-mail je již zaregistrován.<br />Přihlaste se, zkuste jiný e-mail, anebo potvrďte založení účtu ve svém emailu pokud jste tak ještě neudělal.");
            setLoading(false);
            return;
        }

        if (password !== passwordConfirm) {
            showAlert("error", "Hesla se neshodují.");
            setLoading(false);
            return;
        }

        const data = {
            fname,
            lname,
            email,
            password,
            password_confirmation: passwordConfirm
        };

        try {
            const res = await axiosInstance.post("/api/registration", data);

            // Úspěšná registrace
            setSuccess(true);
            setTitleText("POTVRZENÍ EMAILU");
            setInfoText("Pro dokončení registrace klikni na tlačítko v emailu");
            setCountdown(59);
            setAlreadyTried(true);
            setLoading(false);
        } catch (err) {
            const errors = err.response?.data?.errors;

            if (errors?.email) {
                const message = errors.email[0];
                if (message.includes("already been taken")) {
                    showAlert("error", "Tento e-mail je již zaregistrován.<br />Přihlaste se, zkuste jiný e-mail anebo potvrďte založení účtu ve svém emailu pokud jste tak ještě neudělal.");
                } else if (message.includes("valid email")) {
                    showAlert("error", "Zadejte platný e-mail.");
                } else {
                    showAlert("error", { message }); // fallback
                }
            } else if (errors) {
                showAlert("error", Object.values(errors).flat().join("\n"));
            } else {
                showAlert("error", "Chyba serveru, zkuste to prosím později.<br />Pokud bude problém přetrvávat, kontaktujte nás prosím na <i>info@techwatch.cz</i>.");
            }

            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            {!success && (
                <>
                    <InputLogin
                        type="text"
                        name="fname"
                        onChange={(e) => setFname(e.target.value)}
                        placeholder="Jméno"
                        required
                        extraClass="half-width"
                    />
                    <InputLogin
                        type="text"
                        name="lname"
                        onChange={(e) => setLname(e.target.value)}
                        placeholder="Příjmení"
                        required
                        extraClass="half-width"
                    />
                    <InputLogin
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        value={email || ""}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {!emailValid && (
                        <div className="error_all"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text">Tento e-mail nelze použít</p></div>
                    )}
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
                            <span className="password-toggle-icon" onClick={togglePassword}>
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>
                        </div>

                        {password.length > 0 && password.length < 8 && (
                            <div className="error_all">
                                <FontAwesomeIcon icon={faCircleXmark} className="error_icon" />
                                <p className="error_text">Heslo musí obsahovat minimálně 8 znaků</p>
                            </div>
                        )}
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

                    <div className="checkbox-container">
                        <input type="checkbox" id="gdpr" name="gdpr" value="yes" className="custom-checkbox" required />
                        <label htmlFor="gdpr" className="checkbox-text">Souhlasím se <a
                            href="https://www.stubchaser.cz/souhlas_se_zpracovanim_osobnich_udaju.html" className="login_a strong">zpracováním osobních
                            údajů</a></label>
                    </div>
                </>
            )}

            <button
                type={alreadyTried ? "button" : "submit"} // submit jen při první registraci
                className={`form-submit extra_space ${countdown > 0 ? "button_disabled" : !(!alreadyTried && countdown === 0 && !success) ? "extra_space" : ""
                    }`}
                disabled={countdown > 0}
                onClick={alreadyTried && countdown === 0 ? handleResend : undefined}
                style={countdown > 0 ? { cursor: "default", opacity: 0.6 } : {}}
            >
                {countdown > 0
                    ? <p className="strong">Zkusit znovu za {countdown}s</p>
                    : alreadyTried
                        ? <p className="strong">Zkusit znovu</p>
                        : <p className="strong">Registrovat se</p>}
            </button>
        </form>
    );
};

export default RegisterForm;
