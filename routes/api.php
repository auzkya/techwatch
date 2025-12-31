<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OAuthController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PhoneController;
use App\Http\Controllers\Api\TechController;

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
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

Route::post('/email-check', [AuthController::class, 'emailCheck']);

// refresh access tokenu (refresh token je v cookie)
Route::post('/refresh', [AuthController::class, 'refresh']);

// logout – smaže access + refresh token
Route::post('/logout', [AuthController::class, 'logout']);

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
Route::middleware('auth:sanctum')->post('/tech', [TechController::class, 'tech']);
