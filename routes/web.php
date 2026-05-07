<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;

// Route::get('/verify/{token}', [AuthController::class, 'verify']);

// NOV ROUTE pro prodloužení active_worker (Hledám práci)
Route::get('/extend-active-worker', [ProfileController::class, 'extendActiveWorker'])
    ->name('extend-active-worker')
    ->middleware('signed'); // DŮLEŽITÉ: pouze signed URLs

// NOV ROUTE PRO OTEVENÍ NOTIFIKACE (označí jako přečtenou a přesměruje na frontend)
Route::get('/open-notification/{notification}', function (Notification $notification) {
    // Označíme jako přečtené
    $notification->update(['is_read' => true]);

    // Přesměrujeme na FRONTEND (port 3000)
    // env('FRONTEND_URL') vytáhne tu správnou adresu z tvého souboru
    $frontendUrl = env('FRONTEND_URL', 'https://techwatch.app/app');

    return Redirect::to($frontendUrl.'/?open_notif='.$notification->id);
})->name('notification.email.open');
// OAuth Routes
Route::get('/auth/{provider}/redirect', function (Request $request, $provider) {
    $validProviders = ['google', 'facebook'];
    if (! in_array($provider, $validProviders)) {
        abort(404);
    }

    $target = $request->query('redirect', '/');

    // Zakódujeme cíl do parametru state, který Google pošle zpět
    return Socialite::driver($provider)
        ->stateless()
        ->with(['state' => 'redirect='.$target])
        ->redirect();
});

// OAuth callback
Route::get('/auth/{provider}/callback', function (Request $request, $provider) {
    $validProviders = ['google', 'facebook'];
    if (! in_array($provider, $validProviders)) {
        abort(404);
    }

    try {
        $socialUser = Socialite::driver($provider)->stateless()->user();
    } catch (\Exception $e) {
        return redirect(config('app.frontend_url').'/login?error=oauth_failed');
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
            $reason = $user->ban_reason ? '&reason='.urlencode($user->ban_reason) : '';

            return redirect($frontend.'/login?error=banned'.$reason);
        }

        // Pokud je uživatel smazaný (trashed)
        if ($user->trashed()) {
            return redirect($frontend.'/login?error=deleted');
        }
    }

    // Pokud uživatel neexistuje vůbec, přesměruj na registraci s předvyplněnými údaji
    if (! $user) {
        $name = $socialUser->getName() ?? '';
        [$fname, $lname] = explode(' ', $name.' ', 2);

        return redirect(
            $frontend.'/oauth-registration?'.http_build_query([
                'email' => $email,
                'fname' => $fname,
                'lname' => $lname,
                'provider' => $provider,
                'provider_id' => $providerId,
                'redirect' => $targetRedirect,
            ])
        );
    }

    // EXISTUJÍCÍ UŽIVATEL → VYTVO TOKENY
    $providerColumn = $provider.'_id';
    if (! $user->{$providerColumn}) {
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

    return redirect($frontend.'/oauth-callback?token='.$accessToken.'&redirect='.urlencode($targetRedirect))
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

// Pokud někdo přijde na api.techwatch.app/ přímo
Route::get('/', function () {
    abort(404);
});