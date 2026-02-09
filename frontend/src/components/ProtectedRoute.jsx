import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES, buildRoute } from "../routes/RouteNames";
import { useLoading } from "../context/LoadingContext";

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const { loading } = useLoading();

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to={buildRoute(ROUTES.LOGIN)} replace />;
    }

    return children;
};

export default ProtectedRoute;
