import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import { ROUTES, buildRoute } from "../routes/RouteNames";

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, isAuthReady } = useAuth();
    const { loading } = useLoading();
    const location = useLocation();

    if (!isAuthReady) {
        return null;
    }

    if (!user) {
        return <Navigate to={buildRoute(ROUTES.LOGIN)} state={{ from: location }} replace />;
    }

    if (adminOnly && (user.role !== 'admin_viewer' && user.role !== 'admin_moderator' && user.role !== 'super_admin')) {
        return <Navigate to={ROUTES.FORBIDDEN} />;
    }

    return children;
};

export default ProtectedRoute;
