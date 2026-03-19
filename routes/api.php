<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OAuthController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PhoneController;
use App\Http\Controllers\Api\TechController;
use App\Http\Controllers\Api\FavouriteController;
use App\Http\Controllers\Api\ReviewUserController;
use App\Http\Controllers\Api\ReviewItemController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AdminController;

/*
|--------------------------------------------------------------------------
| Healthcheck
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['message' => 'pong']);
});

/*
|--------------------------------------------------------------------------
| AUTH – přihlášení, registrace, tokeny
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/registration', [AuthController::class, 'registration']);
Route::get('/verify/{token}', [AuthController::class, 'verify']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

Route::post('/email-check', [AuthController::class, 'emailCheck']);

// refresh access tokenu (refresh token je v cookie)
Route::post('/refresh', [AuthController::class, 'refresh'])
    ->middleware('throttle:10,1');  // max 10 pokusů za minutu

// logout – smaže access + refresh token
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);

// vrátí aktuálního přihlášeného uživatele
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| PASSWORD RESET
|--------------------------------------------------------------------------
*/
Route::post('/password-reset-request', [PasswordController::class, 'passwordResetRequest']);
Route::post('/password-reset', [PasswordController::class, 'passwordReset']);

/*
|--------------------------------------------------------------------------
| OAUTH
|--------------------------------------------------------------------------
*/
Route::post('/oauth-login', [OAuthController::class, 'oauthLogin']);
Route::post('/oauth-registration', [OAuthController::class, 'oauthRegistration']);

/*
|--------------------------------------------------------------------------
| USER PROFILE
|--------------------------------------------------------------------------
*/
// REST poznámka:
Route::middleware('auth:sanctum')->put('/user', [ProfileController::class, 'update']);
Route::get('/user/{id}/profile-check', [ProfileController::class, 'profileCheck']);
Route::post('/user/{id}/looking-for-job-toggle', [ProfileController::class, 'lookingForJobToggle']);

Route::get('/user/{id}', [ProfileController::class, 'show']);

Route::middleware('auth:sanctum')->post('/user/update-rider', [ProfileController::class, 'updateRider']);
/*
|--------------------------------------------------------------------------
| PHONE VERIFICATION
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->post('/send-otp', [PhoneController::class, 'sendOtp']);
Route::middleware('auth:sanctum')->post('/verify-otp', [PhoneController::class, 'verifyOtp']);
Route::middleware('auth:sanctum')->post('/phone-lookup', [PhoneController::class, 'phoneLookup']);

Route::middleware('auth:sanctum')->post('/phone-check', [PhoneController::class, 'phoneCheck']);

/*
|--------------------------------------------------------------------------
| TECH
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Uuložení nového inzerátu
    Route::post('/tech', [TechController::class, 'store']);
    // Route pro úpravu stávajícího inzerátu (edit tech)
    Route::put('/tech/{id}', [TechController::class, 'update']);
    // Route pro získání detailu inzerátu
    Route::get('/tech/{id}', [TechController::class, 'show']);
    // Změna stavu (Skrýt/Zobrazit)
    Route::patch('/items/{id}/status', [TechController::class, 'updateStatus']);
    // Smazání inzerátu
    Route::delete('/items/{id}', [TechController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| LISTINGS
|--------------------------------------------------------------------------
*/
// Seznam pracovníků s volitelnými filtry (category, location, search)
Route::middleware('auth:sanctum')->get('/workers-listings', [ProfileController::class, 'index']);

// Seznam techniky s volitelnými filtry
Route::middleware('auth:sanctum')->get('/tech-listings', [TechController::class, 'index']);

// Seznam techniky konkrétního uživatele
Route::get('/user-listings/{userId?}', [TechController::class, 'getUserListings']);

/*
|--------------------------------------------------------------------------
| Uložené položky
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->post('/favourites/user/{id}', [FavouriteController::class, 'toggleUser']);
Route::middleware('auth:sanctum')->post('/favourites/item/{id}', [FavouriteController::class, 'toggleItem']);
Route::middleware('auth:sanctum')->get('/favourites', [FavouriteController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Hodnocení
|--------------------------------------------------------------------------
*/
/* --- Hodnocení uživatelů --- */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/{id}/reviews', [ReviewUserController::class, 'index']);
    Route::post('/user/{id}/reviews', [ReviewUserController::class, 'store']);
    Route::put('/reviews-user/{id}', [ReviewUserController::class, 'update']);
    Route::delete('/reviews-user/{id}', [ReviewUserController::class, 'destroy']);
});

/* --- Hodnocení techniky (Items) --- */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/item/{id}/reviews', [ReviewItemController::class, 'index']);
    Route::post('/item/{id}/reviews', [ReviewItemController::class, 'store']);
    Route::put('/reviews-item/{id}', [ReviewItemController::class, 'update']);
    Route::delete('/reviews-item/{id}', [ReviewItemController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Notifikace
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id?}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/send', [NotificationController::class, 'sendInquiry']);
});

// Toto přepíše výchozí chování a vynutí Sanctum middleware pro auth socketů
Broadcast::routes(['middleware' => ['auth:sanctum']]);

/*
|--------------------------------------------------------------------------
| Reporting
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Trasy pro nahlášení (vytvořit nahlášení může každý přihlášený)
    Route::post('/reports', [ReportController::class, 'store']);

    // Trasy jen pro adminy (např. seznam nahlášení)
    Route::get('/admin/reports', function () {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return \App\Models\Report::with('reporter')->get();
    });
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // Statistiky: Vidí analytik, moderátor i hlavní admin
    Route::get('/dashboard-stats', [AdminController::class, 'getDashboardStats'])
        ->middleware('admin:admin_viewer,admin_moderator,super_admin');

    // Nahlášení (Nevyřízená): Vidí jen moderátor a hlavní admin
    Route::get('/admin/reports', [ReportController::class, 'index'])
        ->middleware('admin:admin_moderator,super_admin');

    // Historie (Vyřízená nahlášení)
    Route::get('/admin/resolved-reports', [AdminController::class, 'getResolvedReports'])
        ->middleware('admin:admin_moderator,super_admin');

    // Akce pro vyřízení nahlášení
    Route::post('/admin/reports/{id}/resolve', [AdminController::class, 'resolveReport'])
        ->middleware('admin:admin_moderator,super_admin');

    // Akce pro zvrácení nahlášení
    Route::post('/admin/reports/{id}/revert', [AdminController::class, 'revertReport'])
        ->middleware('admin:admin_moderator,super_admin');
});