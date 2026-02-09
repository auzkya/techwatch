import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import './echo-config.js';

import { AuthProvider } from "./context/AuthContext";

import './index.css';
import App from './App';

import axios from 'axios';
import { LoadingProvider } from "./context/LoadingContext.jsx";
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:8000";

const container = document.getElementById("root"); // id musí sedět s index.html
const root = ReactDOM.createRoot(container);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <LoadingProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </LoadingProvider>
        </BrowserRouter>
    </React.StrictMode>
);
