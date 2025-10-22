import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Login/Register"
import Workers from "../pages/Workers/Workers";
import Tech from "../pages/Tech/Tech";
import TechDetail from "../pages/Tech/TechDetail";
import UserDetail from "../pages/User/UserDetail";
import Profile from "../pages/Profile/Profile";
import Favourites from "../pages/Favourites/Favourites";
import Settings from "../pages/Profile/Settings";
import NotFound from "../pages/NotFound/NotFound";

export const routes = [
    // Domovská stránka
    {
        path: "/",
        element: <Home />,
        label: "Domů",
    },

    // Přihlášení stránka
    {
        path: "/login",
        element: <Login />,
        label: "Přihlášení",
    },

    // Registrace stránka
    {
        path: "/register",
        element: <Register />,
        label: "Registrace",
    },

    // Pracovníci
    {
        path: "/workers",
        element: <Workers />,
        label: "Pracovníci",
    },
    {
        path: "/workers/:subcategory",
        element: <Workers />,
        label: "Kategorie pracovníků",
    },

    // Technika
    {
        path: "/tech",
        element: <Tech />,
        label: "Technika",
    },
    {
        path: "/tech/:subcategory",
        element: <Tech />,
        label: "Kategorie techniky",
    },
    {
        path: "/tech/:slug",
        element: <TechDetail />,
        label: "Detail techniky",
    },

    // Profil uživatele
    {
        path: "/user/:slug",
        element: <UserDetail />,
        label: "Profil uživatele",
    },
    {
        path: "/profile",
        element: <Profile />,
        label: "Můj profil",
    },

    // Oblíbené
    {
        path: "/favourites/:type?",
        element: <Favourites />,
        label: "Oblíbené",
    },

    // Nastavení
    {
        path: "/profile/settings",
        element: <Settings />,
        label: "Nastavení",
    },

    // 404
    {
        path: "*",
        element: <NotFound />,
        label: "404",
    },
];
