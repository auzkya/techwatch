import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import api from "../api"; // cesta podle umístění souboru

import { useAuth } from "../context/AuthContext";

import InputLogin from "./InputLogin";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';


const FormConfirmName = ({ setLoading, setError }) => {
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const { refreshAccessToken } = useAuth();
    const [fname, setFname] = useState("");
    const [lname, setLname] = useState("");
    const [email, setEmail] = useState("");
    const [provider, setProvider] = useState("");
    const [providerId, setProviderId] = useState("");

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setEmail(params.get("email") || "");
        setFname(params.get("fname") || "");
        setLname(params.get("lname") || "");
        setProvider(params.get("provider") || "");
        setProviderId(params.get("provider_id") || "");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/api/oauth-registration", {
                email,
                fname,
                lname,
                provider,
                provider_id: providerId
            });

            // 🔑 backend už nastavil refresh_token cookie
            await refreshAccessToken();
            navigate("/");
        } catch (err) {
            console.error(err);
            setError("Chyba serveru");
        } finally {
            setLoading(false);
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
            <button type="submit" className="form-submit extra_space" disabled={false}>
                <p className="strong">Dokončit registraci</p>
            </button>
        </form>
    );
};

export default FormConfirmName;
