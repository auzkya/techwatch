<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Načtení aktuálně autentizovaného uživatele přes rozhraní Sanctum
        $user = auth('sanctum')->user();

        // Použití výchozí role administrátora při nevyplněném seznamu rolí
        if (empty($roles)) {
            $roles = ['admin'];
        }

        // Ověření, že uživatel existuje a má alespoň jednu požadovanou roli
        if ($user && in_array($user->role, $roles)) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthorized admin access'], 403);
    }
}
