import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
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

        if (!token) {
            showAlert("error", "Nepodařilo se přihlásit přes OAuth.");
            navigate(buildRoute(ROUTES.LOGIN), { replace: true });
            return;
        }

        (async () => {
            try {
                // 🔑 TADY JE KLÍČ
                await loginUser(token);
                navigate("/", { replace: true });
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
