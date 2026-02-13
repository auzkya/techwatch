import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000', // nebo https://cathern-puppyish-apparently.ngrok-free.dev
    //withCredentials: true,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        "ngrok-skip-browser-warning": "true", // pokud stále používáš ngrok
    },
});

export default api;
