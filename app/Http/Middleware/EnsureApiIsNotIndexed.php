<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureApiIsNotIndexed
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return $response;
    }    
}