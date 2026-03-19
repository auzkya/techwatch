import { createContext, useContext, useEffect, useRef, useState } from "react";
import axiosInstance, {
    setAccessToken as setAxiosToken,
} from "../api/axiosInstance";
import { cache } from "../utils/cacheManager";
import { useLoading } from "./LoadingContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { setLoading } = useLoading();
    const [user, setUser] = useState(null);
    const [accessToken, setAccessTokenState] = useState(null);
    const initializationAttempted = useRef(false);
    const isRefreshing = useRef(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // HLÍDAČ ZMĚNY UŽIVATELE V JINÉM TABU
    useEffect(() => {
        const handleStorageChange = (e) => {
            // Hledáme klíč 'user_data' (koresponduje s CACHE_KEYS.USER_DATA)
            if (e.key === "user_data") {
                try {
                    // Rozbalíme data z formátu CacheManageru {value, timestamp, ttl}
                    const newCacheEntry = e.newValue
                        ? JSON.parse(e.newValue)
                        : null;
                    const newUser = newCacheEntry ? newCacheEntry.value : null;
                    const oldUser = user;

                    // 1. SCÉNÁŘ: Přihlášení jiného uživatele v jiném tabu
                    if (newUser && oldUser && newUser.id !== oldUser.id) {
                        console.warn(
                            "Změna uživatele detekována. Obnovuji stránku...",
                        );
                        window.location.reload();
                    }

                    // 2. SCÉNÁŘ: Odhlášení v jiném tabu
                    if (!newUser && oldUser) {
                        console.warn("Odhlášení detekováno v jiném tabu.");
                        setUser(null);
                        setAccessToken(null);
                        window.location.href = "/login";
                    }
                } catch (err) {
                    console.error("Chyba při synchronizaci tabů:", err);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [user]);

    // Helper pro nastavení tokenu
    const setAccessToken = (token) => {
        setAccessTokenState(token);
        setAxiosToken(token);
    };

    // Aktualizace user s automatickou synchronizací cache
    const updateUser = (newUserData) => {
        setUser(newUserData);

        if (newUserData) {
            cache.setActiveWorkerTill(newUserData.active_worker_till);
            cache.setProfileImage(newUserData.profile_image_url);
            cache.setUserData(newUserData);
        }
    };

    // Načtení uživatele pomocí access tokenu
    const loadUser = async (token) => {
        try {
            const res = await axiosInstance.get("/api/user", {
                headers: { Authorization: `Bearer ${token}` },
            });
            updateUser(res.data); // ✅ Použij updateUser místo setUser
            return res.data;
        } catch (error) {
            console.error("Chyba při načítání uživatele:", error);
            setUser(null);
            setAccessToken(null);
            cache.clear(); // ✅ Vyčisti cache při chybě
            throw error;
        }
    };

    // Získání nového access tokenu pomocí refresh tokenu
    const refreshAccessToken = async () => {
        if (isRefreshing.current) return; // Pokud už refresh běží, nepouštěj další
        isRefreshing.current = true;
        try {
            console.log("🔄 Pokouším se obnovit token...");
            const res = await axiosInstance.post("/api/refresh");
            const newAccessToken = res.data.access_token;
            console.log("✅ Token obnoven");

            setAccessToken(newAccessToken);

            // ✅ Pokud backend vrací user v /refresh, použij ho
            if (res.data.user) {
                updateUser(res.data.user);
            } else {
                await loadUser(newAccessToken);
            }

            return newAccessToken;
        } catch (error) {
            console.log("ℹ️ Uživatel není přihlášen (žádný refresh token)");
            setUser(null);
            setAccessToken(null);
            cache.clear();
            return null;
        } finally {
            isRefreshing.current = false; // Uvolni zámek
        }
    };

    // Přihlášení - email + password NEBO jen access token (OAuth/Verify)
    const loginUser = async (emailOrToken, password) => {
        const isOAuthLogin = password === undefined;

        console.log("🔐 loginUser called:", {
            isOAuth: isOAuthLogin,
            hasPassword: !!password,
        });

        // OAuth/Verify přihlášení s tokenem (jen 1 parametr)
        if (isOAuthLogin) {
            console.log("→ OAuth/Verify přihlášení s tokenem");
            const token = emailOrToken;
            setAccessToken(token);
            await loadUser(token);
            console.log("✅ OAuth/Verify přihlášení úspěšné");
            return token;
        }

        // Normální přihlášení emailem a heslem (2 parametry)
        console.log("→ Normální přihlášení emailem");
        const res = await axiosInstance.post("/api/login", {
            email: emailOrToken,
            password,
        });
        const token = res.data.access_token;
        setAccessToken(token);

        // ✅ Pokud backend vrací user při loginu, použij ho
        if (res.data.user) {
            updateUser(res.data.user);
        } else {
            await loadUser(token);
        }

        console.log("✅ Normální přihlášení úspěšné");
        return token;
    };

    // Odhlášení
    const logoutUser = async () => {
        // 1. Okamžitě vymaž tokeny v paměti, aby interceptor už nerefreshoval
        const currentToken = accessToken;
        setAccessToken(null);
        setUser(null);
        cache.clear();
        try {
            await axiosInstance.post("/api/logout");
        } catch (error) {
            console.error("Chyba při odhlášení:", error);
        }
    };

    // ✅ JEDINÝ useEffect - inicializace při startu
    useEffect(() => {
        // Spusť pouze jednou, i v Strict Mode
        if (initializationAttempted.current) {
            return;
        }
        initializationAttempted.current = true;

        const initAuth = async () => {
            try {
                // 1️⃣ Zkus načíst z cache pro okamžité zobrazení
                const cachedUser = cache.getUserData();
                if (cachedUser) {
                    console.log("📦 Načten cached user (okamžité zobrazení)");
                    setUser(cachedUser);
                }

                // 2️⃣ Zkus obnovit token (fresh data ze serveru)
                console.log("🚀 Inicializace auth - pokus o refresh...");
                const res = await axiosInstance.post("/api/refresh");

                setAccessToken(res.data.access_token);

                // Pokud backend vrací user data přímo v /refresh (doporučuji!)
                if (res.data.user) {
                    updateUser(res.data.user);
                    console.log("✅ Token a user data obnoveny při startu");
                } else {
                    // Jinak udělej další request na /api/user
                    await loadUser(res.data.access_token);
                    console.log("✅ Token obnoven, user načten dodatečně");
                }
            } catch (err) {
                console.log("ℹ️ Žádný refresh token - uživatel není přihlášen");
                setUser(null);
                cache.clear();
            } finally {
                setIsAuthReady(true);
                setTimeout(() => {
                    setLoading(false);
                }, 50); // Přidáme malý timeout (např. 50ms), aby se React stihl usadit
            }
        };

        initAuth();
    }, []); // ✅ Prázdné závislosti - spustí se jen jednou

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                loginUser,
                logoutUser,
                //loading,
                refreshAccessToken,
                setUser: updateUser, // ✅ Exportuj updateUser jako setUser
                isAuthReady,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
