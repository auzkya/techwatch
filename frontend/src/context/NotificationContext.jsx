import { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from './AuthContext';
import { useLoading } from './LoadingContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user, accessToken } = useAuth();
    const { setLoading } = useLoading();
    const [notifications, setNotifications] = useState([]);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [isInitialLoaded, setIsInitialLoaded] = useState(false); // Klíč k optimalizaci

    const updateCounts = (data) => {
        setUnreadMessagesCount(data.filter(n => n.type === 'direct_message' && !n.is_read).length);
        setUnreadNotifsCount(data.filter(n => n.type !== 'direct_message' && !n.is_read).length);
    };

    useEffect(() => {
        if (!user || !accessToken) return;

        const initNotifications = async () => {
            try {
                // 1. Zásadní oprava: Nastavení tokenu pro Echo před jakýmkoliv voláním kanálu
                // Pokud používáte Pusher, je dobré aktualizovat přímo auth headers
                window.Echo.connector.options.auth.headers.Authorization = `Bearer ${accessToken}`;

                // 2. Načteme existující data z API
                const res = await axiosInstance.get('/api/notifications');
                setNotifications(res.data);
                updateCounts(res.data);
                setIsInitialLoaded(true);

                // 3. Připojíme Realtime
                const channelName = `user.${user.id}`;
                console.log("📡 Připojuji NotificationContext k:", channelName);

                // private() teď použije aktualizované headers pro POST /broadcasting/auth
                window.Echo.private(channelName)
                    .listen('.notification.sent', (e) => {
                        // ... zbytek logiky listenru
                    });

            } catch (err) {
                console.error("Chyba inicializace notifikací:", err);
            }
        };

        initNotifications();

        return () => {
            if (window.Echo && user) {
                window.Echo.leave(`user.${user.id}`);
            }
        };
    }, [user, accessToken]); // Odstraňte updateCounts z dependencí, pokud je definována uvnitř

    const markAsRead = async (idOrAll, type = null) => {
        // 1. Uložíme si původní stav pro případný rollback
        const originalNotifications = [...notifications];

        // 2. OPTIMISTICKÝ UPDATE: Okamžitě změníme stav v Reactu
        setNotifications(prev => {
            const updated = prev.map(n => {
                if (idOrAll === 'all') {
                    if (type === 'messages' && n.type === 'direct_message') return { ...n, is_read: true };
                    if (type === 'notifications' && n.type !== 'direct_message') return { ...n, is_read: true };
                    return n;
                }
                return n.id === idOrAll ? { ...n, is_read: true } : n;
            });
            updateCounts(updated); // Funkce, co ti počítá ta čísla u ikon
            return updated;
        });

        // 3. ASYNCHRONNÍ VOLÁNÍ BACKENDU
        try {
            const endpoint = idOrAll === 'all'
                ? `/api/notifications/all/mark-as-read?type=${type === 'messages' ? 'direct_message' : 'notifications'}`
                : `/api/notifications/${idOrAll}/mark-as-read`;

            await axiosInstance.post(endpoint);
        } catch (err) {
            console.error("Chyba při ukládání přečtení:", err);
            // ROLLBACK: Pokud backend selže, vrátíme stará data
            setNotifications(originalNotifications);
            updateCounts(originalNotifications);
            throw err; // Vyhodíme dál pro showAlert v Headeru
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadMessagesCount, unreadNotifsCount, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
