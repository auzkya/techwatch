import React, { createContext, useContext, useRef, useState } from "react";
import Alert from "../components/Alert";
import { v4 as uuidv4 } from "uuid";

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
