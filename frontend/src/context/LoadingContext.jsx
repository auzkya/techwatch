import { createContext, useContext, useState } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {loading && (
                <div className="loader_container_fullscreen">
                    <div className="loader"></div>
                </div>
            )}
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
