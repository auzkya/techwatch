import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const ForgotPasswordForm = ({ setLoading, setErrorTop, setInfoText }) => {
    const [email, setEmail] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [alreadyTried, setAlreadyTried] = useState(false);
    const [success, setSuccess] = useState(false);

    // odpočet
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || countdown > 0) return;

        setErrorTop("");
        setLoading(true);

        try {
            const res = await axiosInstance.post(
                "/api/password-reset-request",
                { email },
            );

            // Úspěch
            setInfoText(
                "Na zadaný e-mail jsme odeslali odkaz pro obnovení hesla",
            );
            setSuccess(true);
            setCountdown(59);
            setAlreadyTried(true);
        } catch (err) {
            console.error("Chyba při odeslání:", err);
            const msg =
                err.response?.data?.message ||
                "Nepodařilo se odeslat e-mail pro obnovu hesla.";
            setErrorTop(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            {!success && (
                <input
                    type="email"
                    placeholder="Zadejte svůj e-mail"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-login"
                />
            )}

            <button
                type="submit"
                className={`form-submit extra_space ${countdown > 0 ? "button_disabled" : ""}`}
                disabled={countdown > 0}
            >
                {(() => {
                    if (countdown > 0)
                        return (
                            <p className="strong">
                                Zkusit znovu za {countdown}s
                            </p>
                        );
                    if (alreadyTried)
                        return <p className="strong">Zkusit znovu</p>;
                    return <p className="strong">Pokračovat</p>;
                })()}
            </button>
        </form>
    );
};

export default ForgotPasswordForm;
