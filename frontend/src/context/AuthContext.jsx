import { createContext, useContext, useEffect, useState, useRef } from "react";
import axiosInstance, { setAccessToken as setAxiosToken } from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessTokenState] = useState(null);
    const initializationAttempted = useRef(false);

    // Helper pro nastavení tokenu
    const setAccessToken = (token) => {
        setAccessTokenState(token);
        setAxiosToken(token);
    };

    // Načtení uživatele pomocí access tokenu
    const loadUser = async (token) => {
        try {
            const res = await axiosInstance.get("/api/user", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            return res.data;
        } catch (error) {
            console.error("Chyba při načítání uživatele:", error);
            setUser(null);
            setAccessToken(null);
            throw error;
        }
    };

    // Získání nového access tokenu pomocí refresh tokenu
    const refreshAccessToken = async () => {
        try {
            console.log('🔄 Pokouším se obnovit token...');
            const res = await axiosInstance.post("/api/refresh");
            const newAccessToken = res.data.access_token;
            console.log('✅ Token obnoven');

            setAccessToken(newAccessToken);
            await loadUser(newAccessToken);

            return newAccessToken;
        } catch (error) {
            console.log("ℹ️ Uživatel není přihlášen (žádný refresh token)");
            setUser(null);
            setAccessToken(null);
            return null;
        }
    };

    // Přihlášení - email + password NEBO jen access token (OAuth/Verify)
    const loginUser = async (emailOrToken, password) => {
        // ⚠️ OPRAVA: Místo arguments použij kontrolu password
        const isOAuthLogin = password === undefined;

        console.log('🔐 loginUser called:', {
            isOAuth: isOAuthLogin,
            hasPassword: !!password
        });

        // OAuth/Verify přihlášení s tokenem (jen 1 parametr)
        if (isOAuthLogin) {
            console.log('→ OAuth/Verify přihlášení s tokenem');
            const token = emailOrToken;
            setAccessToken(token);
            await loadUser(token);
            console.log('✅ OAuth/Verify přihlášení úspěšné');
            return token;
        }

        // Normální přihlášení emailem a heslem (2 parametry)
        console.log('→ Normální přihlášení emailem');
        const res = await axiosInstance.post("/api/login", {
            email: emailOrToken,
            password
        });
        const token = res.data.access_token;
        setAccessToken(token);
        await loadUser(token);
        console.log('✅ Normální přihlášení úspěšné');
        return token;
    };

    // Odhlášení
    const logoutUser = async () => {
        try {
            await axiosInstance.post("/api/logout", {}, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            });
        } catch (error) {
            console.error("Chyba při odhlášení:", error);
        } finally {
            setAccessToken(null);
            setUser(null);
        }
    };

    // Při startu aplikace zkusíme získat access token
    useEffect(() => {
        // Spusť pouze jednou, i v Strict Mode
        if (initializationAttempted.current) {
            return;
        }
        initializationAttempted.current = true;

        const initAuth = async () => {
            try {
                console.log('🚀 Inicializace auth - pokus o refresh...');
                const res = await axiosInstance.post('/api/refresh');
                setAccessToken(res.data.access_token);
                setUser(res.data.user);
                console.log('✅ Token obnoven při startu');
            } catch (err) {
                console.log('ℹ️ Žádný refresh token - uživatel není přihlášen');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            loginUser,
            logoutUser,
            loading,
            refreshAccessToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
