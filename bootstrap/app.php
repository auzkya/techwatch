<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Neindexování https://api.techwatch.app/
        $middleware->api(append: [
            \App\Http\Middleware\EnsureApiIsNotIndexed::class,
        ]);
        // Autorizace admina
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);
        $middleware->statefulApi();
        // CSRF výjimky
        $middleware->validateCsrfTokens(except: [
            'api/broadcasting/auth',
            'api/refresh', // Přidej i refresh, pokud s ním máš potíže
        ]);
        // Cookies
        $middleware->encryptCookies(except: [
            'refresh_token',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
