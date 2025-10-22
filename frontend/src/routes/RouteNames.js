// Kolekce konstant pro opakované použití cest

export const ROUTES = {
  HOME: "/",

  //WORKERS: "/workers",
  WORKERS_CATEGORY: "/workers/:subcategory",

  //TECH: "/tech",
  TECH_CATEGORY: "/tech/:subcategory",
  TECH_DETAIL: "/tech/:slug-:id",

  USER_DETAIL: "/user/:slug-:id", // univerzální veřejný profil
  PROFILE: "/profile",             // osobní profil přihlášeného uživatele
  SETTINGS: "/profile/settings",

  FAVOURITES: "/favourites/:type?",

  NOT_FOUND: "*",
};

// Pomocné funkce pro generování cest
export const buildRoute = (route, params = {}) => {
  let path = route;

  // Nahrazení všech :param
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });

  // Odstranění nepovinných parametrů typu :subcategory?
  path = path.replace(/\/:.*\?/g, "");

  return path;
};
