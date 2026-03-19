import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
    withCredentials: true, // KRITICKÉ! pro httpOnly cookie
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Interceptor pro automatické přidání access tokenu
let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
    console.log("🔑 Access token nastaven:", token ? "ANO" : "NE");
};

export const getAccessToken = () => accessToken;

// Request interceptor - přidá access token do hlavičky
axiosInstance.interceptors.request.use(
    (config) => {
        if (accessToken && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor - automatický refresh při 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ignoruj 401 z refresh a login endpointů
        if (
            originalRequest.url.includes("/refresh") ||
            originalRequest.url.includes("/login") ||
            originalRequest.url.includes("/logout") ||
            originalRequest.url.includes("/registration")
        ) {
            return Promise.reject(error);
        }

        if (error.response?.status === 403) {
            console.warn("🚫 Přístup odepřen (403). Přesměrovávám...");
            // Použijeme window.location pro okamžitý "vyhazov" na stránku 403
            // Tato cesta musí existovat v RouteNames.js a AppRoutes.js
            window.location.href = "/403";
            return Promise.reject(error);
        }

        // Pokud je 401 a není to už retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log("🔄 Pokouším se obnovit access token...");

                // DŮLEŽITÉ: Použij čistý axios aby se nevyvolal interceptor znovu
                const res = await axios.post(
                    `${axiosInstance.defaults.baseURL}/api/refresh`,
                    {},
                    { withCredentials: true },
                );

                const newToken = res.data.access_token;
                console.log("✅ Nový access token získán");

                setAccessToken(newToken);
                processQueue(null, newToken);

                axiosInstance.defaults.headers.common["Authorization"] =
                    `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.log(
                    "❌ Refresh token selhal:",
                    refreshError.response?.data || refreshError.message,
                );
                processQueue(refreshError, null);
                setAccessToken(null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;
