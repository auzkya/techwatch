<?php

use Illuminate\Support\Facades\Route;

// API routes jsou v routes/api.php
// Tady řešíme pouze frontendové cesty

Route::get('/{any}', function () {
    return file_get_contents(public_path('react/index.html'));
})->where('any', '^(?!api).*$');
