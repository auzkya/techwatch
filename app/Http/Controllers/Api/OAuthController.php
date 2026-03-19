<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class OAuthController extends Controller
{
    public function oauthLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'provider' => 'required|in:google,facebook',
            'provider_id' => 'required|string',
        ]);

        $providerColumn = $request->provider.'_id';

        $user = User::withTrashed()->where('email', $request->email)->first();

        if (! $user || $user->{$providerColumn} !== $request->provider_id) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Ověření, zda není uživatel zablokovaný
        if ($user->is_banned) {
            return redirect(config('app.frontend_url').'/login?error=banned');
        }

        // Ověření, zda není uživatel smazaný
        if ($user->trashed()) {
            return redirect(config('app.frontend_url').'/login?error=deleted');
        }

        // smaž staré refresh tokeny
        $user->tokens()
            ->where('name', 'refresh')
            ->delete();

        $accessToken = $user->createToken(
            'access',
            ['*'],
            now()->addMinutes(30)
        )->plainTextToken;

        $refreshToken = $user->createToken(
            'refresh',
            ['refresh'],
            now()->addDays(14)
        )->plainTextToken;

        $redirectTo = $request->query('redirect', '/');

        return redirect(config('app.frontend_url')."/oauth-callback?token=$accessToken&redirect=".urlencode($redirectTo))
            ->cookie(
                'refresh_token',
                $refreshToken,
                60 * 24 * 14,
                '/',
                null,
                false,
                true,
                false,
                'Lax'
            );
    }

    public function oauthRegistration(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'fname' => 'required|string',
            'lname' => 'required|string',
            'provider' => 'required|in:google,facebook,github',
            'provider_id' => 'required|string',
        ]);

        $providerColumn = $request->provider.'_id';

        $user = User::create([
            'first_name' => strip_tags($request->fname),
            'last_name' => strip_tags($request->lname),
            'email' => $request->email,
            $providerColumn => $request->provider_id,
            'password' => null,
            'is_active' => true,
            'last_login' => now(),
        ]);

        $accessToken = $user->createToken(
            'access',
            ['*'],
            now()->addMinutes(30)
        )->plainTextToken;

        $refreshToken = $user->createToken(
            'refresh',
            ['refresh'],
            now()->addDays(14)
        )->plainTextToken;

        $redirectTo = $request->query('redirect', '/');

        // Redirect s cookie a odkazem na případný link
        return redirect(config('app.frontend_url')."/oauth-callback?token=$accessToken&redirect=".urlencode($redirectTo))
            ->cookie(
                'refresh_token',
                $refreshToken,
                60 * 24 * 14,
                '/',
                null,
                false,
                true,
                false,
                'Lax'
            );
    }
}
