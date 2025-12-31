<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\User;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:100',
            'phone' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('users', 'phone')->ignore($request->user()->id),
            ],
            'phone_visible' => 'boolean',
            'spec' => 'nullable|array',
            'spec.*' => 'string|exists:specs,slug',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        // pokud uživatel změnil telefon → zrušit ověření
        if (
            array_key_exists('phone', $validated) &&
            $validated['phone'] !== $user->phone
        ) {
            $user->phone_verified_at = null;
        }

        // telefon je vyplněný, ale není ověřený
        if (
            !empty($validated['phone']) &&
            is_null($user->phone_verified_at)
        ) {
            return response()->json([
                'message' => 'Telefonní číslo musí být ověřeno, nebo pole ponechte prázdné'
            ], 422);
        }

        $user->update([
            'bio' => strip_tags($validated['bio'] ?? null),
            'location' => $validated['location'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'phone_visible' => $validated['phone_visible'] ?? false,
        ]);

        // specializace
        if (isset($validated['spec'])) {
            $specIds = \App\Models\Spec::whereIn('slug', $validated['spec'])->pluck('id');
            $user->specs()->sync($specIds);
        }

        // avatar
        if ($request->hasFile('avatar')) {

            if ($user->profile_image) {
                Storage::disk('public')->delete(
                    str_replace('/storage/', '', $user->profile_image)
                );
            }

            $path = $request->file('avatar')->store('avatars', 'public');

            $user->profile_image = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profil byl aktualizován',
            'user' => $user->load('specs')->append('profile_image_url')
        ]);
    }

    public function profileCheck($id)
    {
        $user = User::with('specs')->findOrFail($id);

        $profileComplete = $user->first_name &&
            $user->last_name &&
            $user->email &&
            $user->profile_img &&
            $user->bio &&
            $user->location &&
            $user->phone;

        $hasSpecializations = $user->specs->count() > 0;

        return response()->json([
            'profileComplete' => $profileComplete,
            'hasSpecializations' => $hasSpecializations
        ]);
    }

    public function lookingForJobToggle(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->looking_for_job = $request->input('lookingForJob');

        if ($user->looking_for_job) {
            // nastavíme dnes + 7 dní
            $user->active_worker_till = now()->addDays(7);
        } else {
            $user->active_worker_till = null; // nebo necháme, jak potřebuješ
        }

        $user->save();

        return response()->json([
            'success' => true,
            'active_worker_till' => $user->active_worker_till
        ]);
    }

}
