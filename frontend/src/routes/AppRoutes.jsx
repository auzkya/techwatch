import { Route, Routes } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { ROUTES } from "./RouteNames";

// Importy stránek (přímo zde)
import OAuthCallback from "../components/OAuthCallback";
import ProtectedRoute from "../components/ProtectedRoute";
import Favourites from "../pages/Favourites/Favourites";
import Home from "../pages/Home/Home";
import ConfirmName from "../pages/Login/Confirm_Name";
import ForgotPassword from "../pages/Login/Forgot_password";
import Login from "../pages/Login/Login";
import Register from "../pages/Login/Register";
import ResetPassword from "../pages/Login/Reset_password";
import VerifySuccess from "../pages/Login/VerifySuccess";
import NotFound from "../pages/NotFound/NotFound";
import EditProfile from "../pages/Profile/EditProfile";
import Settings from "../pages/Profile/Settings";
import AddTech from "../pages/Tech/AddTech";
import Tech from "../pages/Tech/Tech";
import TechDetail from "../pages/Tech/TechDetail";
import UserListings from "../pages/Tech/UserListings";
import UserDetail from "../pages/User/UserDetail";
import Workers from "../pages/Workers/Workers";

const AppRoutes = () => {
    return (
        <Routes>
            {/* --- 1. VEŘEJNÉ STRÁNKY (Bez Headeru) --- */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
            <Route path={ROUTES.VERIFY_SUCCESS} element={<VerifySuccess />} />
            <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallback />} />
            <Route path={ROUTES.OAUTH_REGISTRATION} element={<ConfirmName />} />

            {/* 404 Stránka bez Headeru */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />

            {/* --- 2. CHRÁNĚNÉ STRÁNKY (S Headerem přes MainLayout) --- */}
            <Route element={<MainLayout />}>
                <Route path={ROUTES.HOME} element={<ProtectedRoute><Home /></ProtectedRoute>} />

                {/* Pracovníci */}
                <Route path={ROUTES.WORKERS} element={<ProtectedRoute><Workers /></ProtectedRoute>} />
                <Route path={ROUTES.WORKERS_CATEGORY} element={<ProtectedRoute><Workers /></ProtectedRoute>} />

                {/* Technika */}
                <Route path={ROUTES.TECH} element={<ProtectedRoute><Tech /></ProtectedRoute>} />
                <Route path={ROUTES.TECH_CATEGORY} element={<ProtectedRoute><Tech /></ProtectedRoute>} />
                <Route path={ROUTES.TECH_DETAIL} element={<ProtectedRoute><TechDetail /></ProtectedRoute>} />
                <Route path={ROUTES.ADD_TECH} element={<ProtectedRoute><AddTech isEdit={false} /></ProtectedRoute>} />
                <Route path={ROUTES.EDIT_TECH} element={<ProtectedRoute><AddTech isEdit={true} /></ProtectedRoute>} />
                <Route path={ROUTES.USER_LISTINGS} element={<ProtectedRoute><UserListings /></ProtectedRoute>} />

                {/* Profil a ostatní */}
                <Route path={ROUTES.USER_DETAIL} element={<ProtectedRoute><UserDetail /></ProtectedRoute>} />
                <Route path={ROUTES.EDIT_PROFILE} element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path={ROUTES.FAVOURITES} element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
                <Route path={ROUTES.FAVOURITES_CATEGORY} element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
                <Route path={ROUTES.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
