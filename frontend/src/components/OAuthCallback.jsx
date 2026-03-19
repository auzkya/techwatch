import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";
import { ROUTES, buildRoute } from "../routes/RouteNames";

const OAuthCallback = () => {
    const navigate = useNavigate();
    const { loginUser } = useAuth();
    const { showAlert } = useAlert();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        // 1. Získáme cílovou adresu (defaultně "/app")
        const redirectTo = params.get("redirect") || "/app";

        if (!token) {
            showAlert("error", "Nepodařilo se přihlásit přes OAuth.");
            navigate(buildRoute(ROUTES.LOGIN), { replace: true });
            return;
        }

        (async () => {
            try {
                // 🔑 TADY JE KLÍČ
                await loginUser(token);
                // 2. Použijeme získanou adresu pro navigaci
                // decodeURIComponent zajistí správné přečtení znaků jako / : @
                navigate(decodeURIComponent(redirectTo), { replace: true });
            } catch (e) {
                showAlert("error", "Nepodařilo se přihlásit přes OAuth.");
                navigate(buildRoute(ROUTES.LOGIN), { replace: true });
            }
        })();
    }, [loginUser, navigate, showAlert]);

    return (
        <div className="loader_container">
            <div className="loader"></div>
        </div>
    );
};

export default OAuthCallback;
