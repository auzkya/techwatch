import React from "react";
import AppRoutes from "./routes/AppRoutes";

const App = () => {
  return (
    <>
      <main>
        {/* Výpis všech cest */}
        <AppRoutes />
      </main>
    </>
  );
};

export default App;