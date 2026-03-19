import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { buildRoute, ROUTES } from "../../routes/RouteNames";

const VerifySuccess = () => {
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
            navigate(buildRoute(ROUTES.LOGIN), { replace: true });
            return;
        }

        loginUser(token).then(() => {
            navigate("/app", { replace: true });
        });
    }, []);


    return (
        <div className="loader_container">
            <div className="loader"></div>
        </div>
    );
};

export default VerifySuccess;
