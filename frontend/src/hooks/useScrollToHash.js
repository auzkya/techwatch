import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToHash = (dependencies = []) => {
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const targetId = hash.replace('#', '');

            // Funkce, která se pokusí najít element a scrollovat
            const attemptScroll = () => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-flash');
                    return true; // Povedlo se
                }
                return false; // Ještě tu není
            };

            // 1. Zkusíme to hned
            if (!attemptScroll()) {
                // 2. Pokud tu není, sledujeme změny v DOMu (MutationObserver)
                const observer = new MutationObserver(() => {
                    if (attemptScroll()) {
                        observer.disconnect(); // Jakmile ho najdeme, přestaneme sledovat
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Timeout pro jistotu, aby to neběželo věčně (např. po 5s přestaň)
                const timeout = setTimeout(() => observer.disconnect(), 5000);

                return () => {
                    observer.disconnect();
                    clearTimeout(timeout);
                };
            }
        }
    }, [location.hash, ...dependencies]); // Spustí se při změně hash nebo po načtení dat
};
