import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { getAccessToken } from './api/axiosInstance';

window.Pusher = Pusher;
console.log('🚀 Inicializace Echo konfigurace...');

const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: process.env.REACT_APP_REVERB_APP_KEY,
    wsHost: process.env.REACT_APP_REVERB_HOST,
    wsPort: process.env.REACT_APP_REVERB_PORT || 8080,
    wssPort: process.env.REACT_APP_REVERB_PORT || 443, // Na produkci běží WS přes SSL (443)
    forceTLS: process.env.REACT_APP_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    /*authEndpoint: `${apiUrl}/api/broadcasting/auth`,
    auth: {
        headers: {
            Accept: 'application/json',
            // Authorization zde prázdné, doplníme v Headeru
        },
    },*/
    // Vlastní authorizer, který přidá aktuální token
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                const token = getAccessToken();
                
                // Použijeme fetch nebo axios pro autorizaci
                fetch(`${apiUrl}/api/broadcasting/auth`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                })
                .then(response => response.json())
                .then(data => callback(false, data))
                .catch(error => callback(true, error));
            }
        };
    },
});
