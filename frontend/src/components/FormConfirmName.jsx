import { useEffect, useState } from "react";

import InputLogin from "./InputLogin";

const FormConfirmName = ({ setLoading, setError }) => {
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [email, setEmail] = useState("");
    const [provider, setProvider] = useState("");
    const [providerId, setProviderId] = useState("");

    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setEmail(params.get("email") || "");
        setFname(params.get("fname") || "");
        setLname(params.get("lname") || "");
        setProvider(params.get("provider") || "");
        setProviderId(params.get("provider_id") || "");
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // ⚠️ KLÍČOVÁ ZMĚNA: Vytvoř normální HTML form a submitni ho
        const form = document.createElement("form");
        form.method = "POST";
        form.action = `${apiUrl}/api/oauth-registration`;

        // Přidej všechna data jako hidden inputy
        const fields = {
            email,
            fname,
            lname,
            provider,
            provider_id: providerId,
        };

        Object.entries(fields).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value || "";
            form.appendChild(input);
        });

        // Přidej form do stránky a submitni
        document.body.appendChild(form);
        form.submit();

        // Form submit přesměruje na jinou stránku,
        // takže setLoading(false) už nikdy neproběhne
    };

    return (
        <form onSubmit={handleSubmit} className="form-login">
            <InputLogin
                type="text"
                name="fname"
                placeholder="Jméno"
                required
                extraClass="half-width"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
            />
            <InputLogin
                type="text"
                name="lname"
                placeholder="Příjmení"
                required
                extraClass="half-width"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
            />
            <button
                type="submit"
                className="form-submit extra_space"
                disabled={false}
            >
                <p className="strong">Dokončit registraci</p>
            </button>
        </form>
    );
};

export default FormConfirmName;
