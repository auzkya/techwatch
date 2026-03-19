<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * @param  string  ...$roles  <-- Tady přijímáme seznam povolených rolí
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Použijeme tvůj ověřený způsob se Sanctumem
        $user = auth('sanctum')->user();

        // Pokud v routě nezadáš žádné role, defaultně pustíme jen 'admin' (původní chování)
        if (empty($roles)) {
            $roles = ['admin'];
        }

        // Kontrola: Je uživatel přihlášen a má jednu z požadovaných rolí?
        if ($user && in_array($user->role, $roles)) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthorized admin access'], 403);
    }
}
