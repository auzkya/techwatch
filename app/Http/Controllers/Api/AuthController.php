<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::withTrashed()->where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Špatný email nebo heslo.',
            ], 401);
        }

        if ($user->is_banned) {
            return response()->json([
                'message' => 'Účet je zablokovaný.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Neaktivní uživatel, zkontrolujte e-mail.',
            ], 403);
        }

        // ověříme heslo
        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Špatný email nebo heslo.',
            ], 401);
        }

        $user = Auth::user();
        $user->last_login = now();
        $user->save();

        // smažeme staré tokeny
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

        // ⚠️ KRITICKÉ: Vrať refresh token v httpOnly cookie!
        return response()
            ->json([
                'access_token' => $accessToken,
                'user' => $user,
            ])
            ->cookie(
                'refresh_token',
                $refreshToken,
                60 * 24 * 14,
                '/',
                null,
                false, // secure
                true,  // httpOnly
                false,
                'Lax'
            );
    }

    public function refresh(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token');

        if (! $refreshToken) {
            return response()->json(['message' => 'Missing refresh token'], 401);
        }

        $pat = PersonalAccessToken::findToken($refreshToken);

        if (! $pat || $pat->name !== 'refresh') {
            return response()->json(['message' => 'Invalid refresh token'], 401);
        }

        // Zkontroluj expiraci
        if ($pat->expires_at && $pat->expires_at->isPast()) {
            $pat->delete();

            return response()->json(['message' => 'Expired refresh token'], 401);
        }

        $user = $pat->tokenable;

        // Vytvoř nový access token
        $accessToken = $user->createToken(
            'access',
            ['*'],
            now()->addMinutes(30)
        )->plainTextToken;

        Log::info('Refreshing token', [
            'token_id' => $pat?->id,
            'user_id' => $pat?->tokenable_id,
            'expires' => $pat?->expires_at,
        ]);

        return response()->json([
            'access_token' => $accessToken,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        // Zkontroluj, jestli je uživatel přihlášený
        $user = $request->user();
        if ($user) {
            // Smaž všechny tokeny uživatele
            $user->tokens()->delete();
        }

        // Vždy smaž cookie, i když user není přihlášený
        return response()
            ->json(['message' => 'Odhlášeno'])
            ->cookie(
                'refresh_token',
                '',
                -1,
                '/',
                null,
                false,
                true,
                false,
                'Lax'
            );
    }

    public function registration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fname' => 'required|string|max:100',
            'lname' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'first_name' => $request->fname,
            'last_name' => $request->lname,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => false,
            'email_verification_token' => Str::random(64),
            'email_verification_sent_at' => now(),
        ]);

        $verificationLink = "https://api.techwatch.app/api/verify/{$user->email_verification_token}";

        Mail::send('emails.verify-email', [
            'link' => $verificationLink,
        ], function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Potvrzení emailu');
        });

        return response()->json(['message' => 'Uživatel vytvořen. Zkontrolujte svůj email.']);
    }

    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Uživatel nenalezen.'], 404);
        }

        if ($user->is_active) {
            return response()->json(['message' => 'Uživatel je již aktivní.'], 400);
        }

        $user->update([
            'email_verification_token' => Str::random(64),
            'email_verification_sent_at' => now(),
        ]);

        $verificationLink = "https://api.techwatch.app/api/verify/{$user->email_verification_token}";

        Mail::send('emails.verify-email', [
            'link' => $verificationLink,
        ], function ($message) use ($user) {
            $message->to($user->email)
                ->subject('Potvrzení emailu');
        });

        return response()->json([
            'message' => 'Potvrzovací email byl odeslán znovu.',
        ]);
    }

    public function emailCheck(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $exists = User::where('email', $request->email)->exists();

        return response()->json([
            'valid' => ! $exists,
        ]);
    }

    public function verify($token)  // ⚠️ POUZE TOKEN, bez ID
    {
        $user = User::where('email_verification_token', $token)
            ->where('is_active', false)  // jen neověřené účty
            ->first();

        if (! $user) {
            return redirect(config('app.frontend_url').'/login?error=invalid');
        }

        // Kontrola expirace (např. 24 hodin)
        if ($user->email_verification_sent_at->addHours(24)->isPast()) {
            $user->delete();

            return redirect(config('app.frontend_url').'/login?error=expired');
        }

        // Ověření
        $user->update([
            'is_active' => true,
            'email_verification_token' => null,
            'email_verification_sent_at' => null,
            'last_login' => now(),
        ]);

        // Vytvoř tokeny
        $accessToken = $user->createToken('access', ['*'], now()->addMinutes(30))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(14))->plainTextToken;

        return redirect(config('app.frontend_url')."/verify-success?token=$accessToken")
            ->cookie('refresh_token', $refreshToken, 60 * 24 * 14, '/', null, false, true, false, 'Lax');
    }
}
