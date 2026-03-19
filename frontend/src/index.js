import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./echo-config.js";

import { AuthProvider } from "./context/AuthContext";

import App from "./App";
import "./index.css";

import axios from "axios";
import { AlertProvider } from "./context/AlertContext";
import { LoadingProvider } from "./context/LoadingContext.jsx";
axios.defaults.withCredentials = true;
axios.defaults.baseURL =
    process.env.REACT_APP_API_URL || "http://localhost:8000";

const container = document.getElementById("root"); // id musí sedět s index.html
const root = ReactDOM.createRoot(container);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <LoadingProvider>
                <AlertProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </AlertProvider>
            </LoadingProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
