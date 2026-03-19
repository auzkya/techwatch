import React, { createContext, useContext, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Alert from "../components/Alert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const shownKeysRef = useRef(new Set()); // ⬅️ PAMĚŤ „už zobrazených“

    const showAlert = (type, message, key = null) => {
        // pokud má klíč a už byl zobrazen → NIC
        if (key && shownKeysRef.current.has(key)) {
            return;
        }

        if (key) {
            shownKeysRef.current.add(key);
        }

        // --- OCHRANA PROTI [object Object] ---
        let finalMessage = message;

        // Pokud je message objekt a NENÍ to React element (JSX)
        if (typeof message === 'object' && message !== null && !React.isValidElement(message)) {
            // 1. Zkusíme běžné Laravel klíče
            if (message.message) {
                finalMessage = message.message;
            }
            // 2. Pokud jsou to validační chyby (errors: { field: [msg] })
            else if (message.errors) {
                const firstError = Object.values(message.errors)[0];
                finalMessage = Array.isArray(firstError) ? firstError[0] : "Chyba validace dat.";
            }
            // 3. Totální fallback - převedeme na string, aby to aspoň nespadlo
            else {
                try {
                    finalMessage = JSON.stringify(message);
                } catch {
                    finalMessage = "Došlo k neznámé chybě.";
                }
            }
        }

        setAlerts(prev => [
            ...prev,
            {
                id: uuidv4(),
                type,
                message,
                key
            }
        ]);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}

            <div className="alert_container">
                {alerts.map(alert => (
                    <Alert
                        key={alert.id}
                        type={alert.type}
                        message={alert.message}
                        onClose={() => removeAlert(alert.id)}
                    />
                ))}
            </div>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);
