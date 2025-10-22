import { useState } from "react";
import InputLogin from "./InputLogin";

const RegisterForm = () => {
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            setError("Hesla se neshodují!");
            return;
        }

        setError("");

        const data = {
            fname: e.target.fname.value,
            lname: e.target.lname.value,
            email: e.target.email.value,
            password: password,
            password_confirmation: passwordConfirm
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                setError(Object.values(result.errors).flat().join("\n"));
            } else {
                console.log("Uživatel vytvořen:", result.user);
                // případně přesměrování nebo zobrazení zprávy
            }
        } catch (err) {
            console.error(err);
            setError("Chyba při registraci.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            <InputLogin
                type="text"
                name="fname"
                placeholder="Jméno"
                required
                extraClass="half-width"
            />
            <InputLogin
                type="text"
                name="lname"
                placeholder="Příjmení"
                required
                extraClass="half-width"
            />
            <InputLogin
                type="email"
                name="email"
                placeholder="Email"
                required
            />
            <InputLogin
                type="password"
                placeholder="Heslo"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <InputLogin
                type="password"
                placeholder="Heslo znovu"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {password && passwordConfirm && password !== passwordConfirm && (
                <p>Hesla se neshodují</p>
            )}
            <button type="submit" className="form-submit"><p className="strong">Registrovat se</p></button>
        </form>
    );
};

export default RegisterForm;
