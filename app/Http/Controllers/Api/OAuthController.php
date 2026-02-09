<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Models\Item;
use App\Mail\VerifyEmail;

class OAuthController extends Controller
{

    public function oauthLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'provider' => 'required|in:google,facebook',
            'provider_id' => 'required|string',
        ]);

        $providerColumn = $request->provider . '_id';

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->{$providerColumn} !== $request->provider_id) {
            return response()->json(['message' => 'Unauthorized'], 401);
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

        return response()
            ->json([
                'access_token' => $accessToken,
                'user' => $user
            ])
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

        $providerColumn = $request->provider . '_id';

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

        // ✅ Redirect s cookie
        return redirect(config('app.frontend_url') . "/oauth-callback?token=$accessToken")
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
