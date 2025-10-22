// Dynamicky vykreslí všechny cesty z router.js

import React from "react";
import { Routes, Route } from "react-router-dom";
import { routes } from "./router";

const AppRoutes = () => {
  return (
    <Routes>
      {routes.map(({ path, element }, i) => (
        <Route key={i} path={path} element={element} />
      ))}
    </Routes>
  );
};

export default AppRoutes;
