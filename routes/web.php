<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Models\Notification;

//Route::get('/verify/{token}', [AuthController::class, 'verify']);

// NOVÁ ROUTE pro prodloužení active_worker (HLEDÁM PRÁCI)
Route::get('/extend-active-worker', [ProfileController::class, 'extendActiveWorker'])
    ->name('extend-active-worker')
    ->middleware('signed'); // DŮLEŽITÉ: pouze signed URLs

// NOVÁ ROUTE PRO OTEVŘENÍ NOTIFIKACE (označí jako přečtenou a přesměruje na frontend)
Route::get('/open-notification/{notification}', function (Notification $notification) {
    // 1. Označíme jako přečtené
    $notification->update(['is_read' => true]);

    // 2. Přesměrujeme na FRONTEND (port 3000)
    // env('FRONTEND_URL') vytáhne tu správnou adresu z tvého souboru
    $frontendUrl = env('FRONTEND_URL', 'https://techwatch.app/app');

    return Redirect::to($frontendUrl . '/?open_notif=' . $notification->id);
})->name('notification.email.open');

// ------------------------------------
// OAuth Routes
// ------------------------------------
Route::get('/auth/{provider}/redirect', function (Request $request, $provider) {
    $validProviders = ['google', 'facebook'];
    if (!in_array($provider, $validProviders)) {
        abort(404);
    }

    $target = $request->query('redirect', '/');

    // Zakódujeme cíl do parametru state, který Google pošle zpět
    return Socialite::driver($provider)
        ->stateless()
        ->with(['state' => 'redirect=' . $target])
        ->redirect();
});

// callback URL, kam OAuth provider po přihlášení přesměruje uživatele
/*Route::get('/auth/{provider}/callback', function ($provider) {
    $validProviders = ['google', 'facebook'];
    if (!in_array($provider, $validProviders))
        abort(404);

    try {
        $socialUser = Socialite::driver($provider)->stateless()->user();
    } catch (\Exception $e) {
        return redirect(config('app.frontend_url') . '/login?error=oauth_failed');
    }

    $email = $socialUser->getEmail();
    $name = $socialUser->getName() ?? '';
    $providerId = $socialUser->getId();

    $user = User::where('email', $email)->first();
    $frontend = config('app.frontend_url');

    if ($user) {
        // Uživatel už existuje - přihlásíme ho
        $providerColumn = $provider . '_id';

        // Aktualizuj OAuth ID pokud ještě není nastavené
        if (!$user->{$providerColumn}) {
            $user->{$providerColumn} = $providerId;
        }

        $user->last_login = now();
        $user->save();

        // Vytvoř tokeny
        $user->tokens()->delete(); // Smaž staré tokeny

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

        // ⚠️ OPRAVENO: Vrať TOKENY, ne email v URL!
        return redirect($frontend . "/oauth-success")
            ->cookie(
                'refresh_token',
                $refreshToken,
                60 * 24 * 14,
                '/',
                null,
                env('APP_ENV') === 'production',
                true,
                false,
                'Lax'
            )
            ->cookie(
                'oauth_access_token',  // Dočasná cookie pro předání access tokenu
                $accessToken,
                5, // 5 minut
                '/',
                null,
                false, // httpOnly = false, aby JavaScript mohl přečíst
                false,
                false,
                'Lax'
            );
    } else {
        // Účet neexistuje → přesměruj na registraci
        $nameParts = explode(' ', $name, 2);
        $fname = $nameParts[0] ?? '';
        $lname = $nameParts[1] ?? '';

        $redirectUrl = $frontend . "/oauth-register?email=" . urlencode($email) .
            "&fname=" . urlencode($fname) . "&lname=" . urlencode($lname) .
            "&provider=" . urlencode($provider) .
            "&provider_id=" . urlencode($providerId);

        return redirect($redirectUrl);
    }
});*/

// OAuth callback
Route::get('/auth/{provider}/callback', function (Request $request, $provider) {
    $validProviders = ['google', 'facebook'];
    if (!in_array($provider, $validProviders))
        abort(404);

    try {
        $socialUser = Socialite::driver($provider)->stateless()->user();
    } catch (\Exception $e) {
        return redirect(config('app.frontend_url') . '/login?error=oauth_failed');
    }

    $email = $socialUser->getEmail();
    $providerId = $socialUser->getId();
    $user = User::withTrashed()->where('email', $email)->first();
    $frontend = config('app.frontend_url');

    // Vytáhneme redirect z parametru state, který se vrátil od Googlu
    $state = $request->query('state');
    parse_str($state, $result);
    $targetRedirect = $result['redirect'] ?? '/';

    if ($user) {
        // Pokud má uživatel ban
        if ($user->is_banned) {
            $reason = $user->ban_reason ? "&reason=" . urlencode($user->ban_reason) : "";
            return redirect($frontend . "/login?error=banned" . $reason);
        }

        // Pokud je uživatel smazaný (trashed)
        if ($user->trashed()) {
            return redirect($frontend . "/login?error=deleted");
        }
    }

    // Pokud uživatel neexistuje vůbec, přesměruj na registraci s předvyplněnými údaji
    if (!$user) {
        $name = $socialUser->getName() ?? '';
        [$fname, $lname] = explode(' ', $name . ' ', 2);

        return redirect(
            $frontend . "/oauth-registration?" . http_build_query([
                'email' => $email,
                'fname' => $fname,
                'lname' => $lname,
                'provider' => $provider,
                'provider_id' => $providerId,
                'redirect' => $targetRedirect,
            ])
        );
    }

    // EXISTUJÍCÍ UŽIVATEL → VYTVOŘ TOKENY
    $providerColumn = $provider . '_id';
    if (!$user->{$providerColumn}) {
        $user->{$providerColumn} = $providerId;
        $user->save();
    }

    $user->tokens()->where('name', 'refresh')->delete();

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

    return redirect($frontend . '/oauth-callback?token=' . $accessToken . '&redirect=' . urlencode($targetRedirect))
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
});

// ------------------------------------
// SPA catch-all route
// ------------------------------------
Route::get('/{any}', function () {
    return file_get_contents(public_path('react/index.html'));
})->where('any', '^(?!api).*$');
