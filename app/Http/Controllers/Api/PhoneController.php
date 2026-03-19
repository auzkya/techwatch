<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Twilio\Rest\Client;

class PhoneController extends Controller
{
    protected Client $twilio;

    public function __construct()
    {
        $this->twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
    }

    /**
     * Odeslat OTP
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        try {
            $verification = $this->twilio
                ->verify
                ->v2
                ->services(config('services.twilio.verify_service'))
                ->verifications
                ->create($request->phone, 'sms', ['locale' => 'cs']);

            return response()->json([
                'success' => true,
                'status' => $verification->status,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Twilio sendOtp error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Ověřit OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        try {
            $check = $this->twilio
                ->verify
                ->v2
                ->services(config('services.twilio.verify_service'))
                ->verificationChecks
                ->create([
                    'to' => $request->phone,
                    'code' => $request->code,
                ]);

            if ($check->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'error' => 'Zadaný kód je neplatný',
                ], 422);
            }

            // ⚠️ NOVÉ: Ulož do phone_verifications tabulky
            PhoneVerification::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'phone' => $request->phone,
                ],
                [
                    'verified_at' => now(),
                    'expires_at' => now()->addMinutes(10), // Vyprší za 10 minut
                ]
            );

            return response()->json([
                'success' => true,
                'verified_phone' => $request->phone,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function phoneLookup(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $phone = $request->phone;

        if (! str_starts_with($phone, '+')) {
            return response()->json([
                'valid' => false,
                'error' => 'Telefonní číslo musí být ve formátu +420...',
            ], 422);
        }

        try {
            $twilio = new Client(
                config('services.twilio.sid'),
                config('services.twilio.token')
            );

            $lookup = $twilio->lookups->v2
                ->phoneNumbers($phone)
                ->fetch([
                    'fields' => 'line_type_intelligence',
                ]);

            if (! empty($lookup->validationErrors)) {
                return response()->json([
                    'valid' => false,
                    'error' => $this->translateTwilioErrors($lookup->validationErrors),
                ], 422);
            }

            return response()->json([
                'valid' => true,
                'phone' => $lookup->phoneNumber,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'error' => 'Neplatné telefonní číslo',
            ], 422);
        }
    }

    private function translateTwilioErrors(array $errors): string
    {
        $map = [
            'TOO_SHORT' => 'Telefonní číslo je příliš krátké',
            'TOO_LONG' => 'Telefonní číslo je příliš dlouhé',
            'INVALID_LENGTH' => 'Telefonní číslo má neplatnou délku',
            'INVALID_COUNTRY_CODE' => 'Neplatná předvolba země',
            'INVALID_PHONE_NUMBER' => 'Neplatné telefonní číslo',
            'NOT_A_NUMBER' => 'Zadaná hodnota není telefonní číslo',
            'LINE_TYPE_NOT_SUPPORTED' => 'Tento typ čísla není podporován',
            'FIXED_LINE' => 'Zadané číslo není mobilní telefon',
            'VOIP' => 'Zadané číslo není mobilní telefon',
        ];

        $translated = [];

        foreach ($errors as $err) {
            $translated[] = $map[$err] ?? 'Neplatné telefonní číslo';
        }

        return implode(', ', array_unique($translated));
    }

    public function phoneCheck(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $user = $request->user();
        $phone = $request->phone;

        // existuje stejné číslo u tohoto uživatele?
        $exists = User::where('phone', $phone)
            ->where('id', '!=', $user->id)
            ->exists();

        return response()->json([
            'exists' => $exists,
        ]);
    }
}
