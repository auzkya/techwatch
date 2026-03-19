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

        // Předání refresh tokenu v HTTP-only cookie pro omezení přístupu skriptů
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

        // Ověření platnosti refresh tokenu podle času expirace
        if ($pat->expires_at && $pat->expires_at->isPast()) {
            $pat->delete();

            return response()->json(['message' => 'Expired refresh token'], 401);
        }

        $user = $pat->tokenable;

        // Vygenerování nového access tokenu po úspěšném ověření refresh tokenu
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
        // Načtení aktuálního uživatele pro revokaci tokenů
        $user = $request->user();
        if ($user) {
            // Revokace všech aktivních tokenů uživatele při odhlášení
            $user->tokens()->delete();
        }

        // Odstranění refresh cookie bez ohledu na stav autentizace
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

    // Ověření účtu podle verifikačního tokenu bez identifikátoru uživatele
    public function verify($token)
    {
        $user = User::where('email_verification_token', $token)
            ->where('is_active', false)
            ->first();

        if (! $user) {
            return redirect(config('app.frontend_url').'/login?error=invalid');
        }

        // Kontrola expirace verifikačního odkazu po 24 hodinách od odeslání
        if ($user->email_verification_sent_at->addHours(24)->isPast()) {
            $user->delete();

            return redirect(config('app.frontend_url').'/login?error=expired');
        }

        // Aktivace účtu a vyčištění verifikačních údajů po úspěšném potvrzení
        $user->update([
            'is_active' => true,
            'email_verification_token' => null,
            'email_verification_sent_at' => null,
            'last_login' => now(),
        ]);

        // Vytvoření nových přístupových tokenů po dokončení aktivace
        $accessToken = $user->createToken('access', ['*'], now()->addMinutes(30))->plainTextToken;
        $refreshToken = $user->createToken('refresh', ['refresh'], now()->addDays(14))->plainTextToken;

        return redirect(config('app.frontend_url')."/verify-success?token=$accessToken")
            ->cookie('refresh_token', $refreshToken, 60 * 24 * 14, '/', null, false, true, false, 'Lax');
    }
}
