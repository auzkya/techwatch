import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const VerifySuccess = () => {
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        loginUser(token).then(() => {
            navigate("/", { replace: true });
        });
    }, []);


    return (
        <div className="loader_container">
            <div className="loader"></div>
        </div>
    );
};

export default VerifySuccess;
