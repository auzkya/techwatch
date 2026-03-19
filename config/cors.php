<?php

return [

    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie', 'auth/*', 'oauth/*', 'oauth-registration', 'send-otp', 'verify-otp', 'reverb/*'],

    'allowed_methods' => ['*'],

    /*'allowed_origins' => [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:4040',
        'https://cathern-puppyish-apparently.ngrok-free.dev', // ngrok tunel
        'https://www.techwatch.app', // produkce
    ],*/

    'allowed_origins' => [
        'https://techwatch.app',
        'https://www.techwatch.app',
        'https://api.techwatch.app', // Pro jistotu i API
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, //true nutné pro cookies
];
