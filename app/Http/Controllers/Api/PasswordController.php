<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    public function passwordResetRequest(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Uživatel s tímto emailem neexistuje.'], 404);
        }

        $token = Str::random(60);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            ['token' => $token, 'created_at' => Carbon::now()]
        );

        $frontendUrl = 'https://techwatch.app';
        $resetLink = "{$frontendUrl}/reset-password/{$token}?email={$user->email}";

        Mail::send('emails.reset-password', ['link' => $resetLink], function ($message) use ($user) {
            $message->to($user->email)->subject('Zapomenuté heslo');
        });

        return response()->json(['message' => 'Email pro obnovení hesla byl odeslán.']);
    }

    public function passwordReset(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // najdeme záznam resetu
        $reset = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (! $reset) {
            return response()->json(['message' => 'Neplatný nebo vypršelý token.'], 400);
        }

        // ověříme uživatele
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Uživatel nenalezen.'], 404);
        }

        // ověříme, že nové heslo není stejné jako staré
        if (Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Nové heslo se nesmí shodovat se starým.'], 400);
        }

        // uložíme nové heslo
        $user->password = Hash::make($request->password);
        $user->save();

        // sSmažeme záznam resetu
        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Heslo bylo úspěšně změněno.',
        ]);
    }
}
