// Kolekce konstant pro opakované použití cest
// a.k.a zdroj pravdy pro cesty

export const ROUTES = {
    // Veřejná úvodní stránka
    LANDING: "/",

    // Vnitřní domovská stránka (po přihlášení)
    HOME: "/app",

    // Admin sekce
    ADMIN: "/admin",

    // Přihlašovací stránky
    LOGIN: "/login",
    VERIFY_SUCCESS: "/verify-success",

    // Zapomenuté heslo
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password/:token",

    // Registrace
    REGISTER: "/register",

    // OAuth
    OAUTH_CALLBACK: "/oauth-callback",
    OAUTH_REGISTRATION: "/oauth-registration",

    // Pracovníci (detail pracovníka je USER_DETAIL)
    WORKERS: "/workers",
    WORKERS_CATEGORY: "/workers/category/:subcategory",

    // Technika
    ADD_TECH: "/add-tech",
    EDIT_TECH: "/tech/edit/:id",
    TECH: "/tech",
    TECH_CATEGORY: "/tech/category/:subcategory",
    TECH_DETAIL: "/tech/item/:id",
    USER_LISTINGS: "/user/:id/listings",

    // Profil uživatele
    USER_DETAIL: "/user/:id/:slug?",
    EDIT_PROFILE: "/edit-profile",

    // Nastavení profilu
    SETTINGS: "/profile/settings",

    // Oblíbené položky
    FAVOURITES: "/favourites",
    FAVOURITES_CATEGORY: "/favourites/category/:subcategory",

    // 403 stránka
    FORBIDDEN: "/403",
    // 404 stránka
    NOT_FOUND: "*",
};

// Pomocné funkce pro generování cest
export const buildRoute = (route, params = {}) => {
    let path = route;

    Object.entries(params).forEach(([key, value]) => {
        // Pokud je hodnota null/undefined pro nepovinný parametr, vymažeme ho
        const val = value || "";
        path = path.replace(`:${key}`, val);
    });

    // Vyčištění dvojitých lomítek na konci, pokud slug chybí
    return path.replace(/\/+$/, "").replace(/\/+(?=\/)/g, "");
};
