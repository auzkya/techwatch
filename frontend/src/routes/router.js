import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import ForgotPassword from "../pages/Login/Forgot_password";
import ResetPassword from "../pages/Login/Reset_password";
import VerifySuccess from "../pages/Login/VerifySuccess";
import Register from "../pages/Login/Register"
import OAuthCallback from "../components/OAuthCallback";
import ConfirmName from "../pages/Login/Confirm_Name";
import Workers from "../pages/Workers/Workers";
import Tech from "../pages/Tech/Tech";
import TechDetail from "../pages/Tech/TechDetail";
import TechAdd from "../pages/Tech/AddTech";
import UserDetail from "../pages/User/UserDetail";
import Profile from "../pages/Profile/Profile";
import EditProfile from "../pages/Profile/EditProfile";
import Favourites from "../pages/Favourites/Favourites";
import Settings from "../pages/Profile/Settings";

import NotFound from "../pages/NotFound/NotFound";

import ProtectedRoute from "../components/ProtectedRoute";
import AddTech from "../pages/Tech/AddTech";

export const routes = [
    // Domovská stránka
    {
        path: "/",
        element: <ProtectedRoute><Home /></ProtectedRoute>,
        label: "Domů",
    },

    // Přihlášení stránka
    {
        path: "/login",
        element: <Login />,
        label: "Přihlášení",
    },

    // Přihlášení stránka
    {
        path: "/verify-success",
        element: <VerifySuccess />,
        label: "Přihlašování",
    },

    // Zapomenuté heslo stránka
    {
        path: "/forgot-password",
        element: <ForgotPassword />,
        label: "Zapomenuté heslo",
    },

    // Resetování hesla stránka
    {
        path: "/reset-password/:token",
        element: <ResetPassword />,
        label: "Resetování hesla",
    },

    // Registrace stránka
    {
        path: "/register",
        element: <Register />,
        label: "Registrace",
    },

    // OAuth callback asi vyměněno za OAuth success
    {
        path: "/oauth-callback",
        element: <OAuthCallback />,
        label: null,
    },

    /*// OAuth success
        {
        path: "/oauth-success",
        element: <OAuthSuccess />,
        label: null,
    },*/

    // Potvrzení jména
    {
        path: "/oauth-registration",
        element: <ConfirmName />,
        label: "Potvrzení jména",
    },

    // Pracovníci
    {
        path: "/workers",
        element: <ProtectedRoute><Workers /></ProtectedRoute>,
        label: "Pracovníci",
    },
    {
        path: "/workers/:subcategory",
        element: <ProtectedRoute><Workers /></ProtectedRoute>,
        label: "Kategorie pracovníků",
    },

    // Technika
    {
        path: "/add-tech",
        element: <ProtectedRoute><AddTech /></ProtectedRoute>,
        label: "Nabídka techniky",
    },
    {
        path: "/tech",
        element: <ProtectedRoute><Tech /></ProtectedRoute>,
        label: "Technika",
    },
    {
        path: "/tech/:subcategory",
        element: <ProtectedRoute><Tech /></ProtectedRoute>,
        label: "Kategorie techniky",
    },
    {
        path: "/tech/:slug",
        element: <ProtectedRoute><TechDetail /></ProtectedRoute>,
        label: "Detail techniky",
    },

    // Profil uživatele
    {
        path: "/user/:slug",
        element: <ProtectedRoute><UserDetail /></ProtectedRoute>,
        label: "Profil uživatele",
    },
    {
        path: "/profile",
        element: <ProtectedRoute><Profile /></ProtectedRoute>,
        label: "Můj profil",
    },
    {
        path: "/edit-profile",
        element: <ProtectedRoute><EditProfile /></ProtectedRoute>,
        label: "Úprava profilu",
    },

    // Oblíbené
    {
        path: "/favourites/:type?",
        element: <ProtectedRoute><Favourites /></ProtectedRoute>,
        label: "Oblíbené",
    },

    // Nastavení
    {
        path: "/profile/settings",
        element: <ProtectedRoute><Settings /></ProtectedRoute>,
        label: "Nastavení",
    },

    // 404
    /*{
        path: "*",
        element: <NotFound />,
        label: "404",
    },*/
];
