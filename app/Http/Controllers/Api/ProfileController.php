<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Spec;
use App\Models\User;
use App\Models\UserRider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Intervention\Image\Facades\Image;

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
                Rule::unique('users', 'phone')->ignore($user->id),
            ],
            'phone_visible' => 'boolean',
            'spec' => 'nullable|array',
            'spec.*' => 'string|exists:specs,slug',
            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp,avif|max:4096',
        ]);
        if (array_key_exists('phone', $validated)) {
            $newPhone = $validated['phone'];

            // SCÉN A: Uživatel telefon smazal
            if (empty($newPhone)) {
                $user->phone = null;
                $user->phone_verified_at = null;
            }
            // SCÉN B: Uživatel telefon změnil na jiné číslo
            elseif ($newPhone !== $user->phone) {
                $verification = \App\Models\PhoneVerification::where('user_id', $user->id)
                    ->where('phone', $newPhone)
                    ->latest()
                    ->first();

                if (! $verification || ! $verification->isValid()) {
                    return response()->json([
                        'message' => 'Nové telefonní číslo musí být ověřeno',
                    ], 422);
                }

                $user->phone = $newPhone;
                $user->phone_verified_at = $verification->verified_at;
                $verification->delete();
            }
        }

        // Update ostatních dat (zde jsem přidal ošetření, aby se nic nepřepsalo, pokud klíč chybí)
        if (array_key_exists('bio', $validated)) {
            $user->bio = $validated['bio'] ? strip_tags($validated['bio']) : null;
        }

        if (array_key_exists('location', $validated)) {
            $user->location = $validated['location'] ? strip_tags($validated['location']) : null;
        }

        $user->phone_visible = $request->boolean('phone_visible');
        $user->save();

        // Specializace
        if (isset($validated['spec'])) {
            $specIds = Spec::whereIn('slug', $validated['spec'])->pluck('id');
            $user->specs()->sync($specIds);
        }

        // Avatar
        if ($request->hasFile('avatar')) {
            // Smazání starého avataru (pokud existuje)
            if ($user->profile_image && ! filter_var($user->profile_image, FILTER_VALIDATE_URL)) {
                Storage::disk('r2')->delete($user->profile_image);
            }

            $file = $request->file('avatar');

            // Generování názvu souboru avatara ve formátu WebP
            $filename = 'avatars/'.$user->id.'_'.time().'.webp';

            // Optimalizace obrázku na čtvercový výřez 400x400 ve formátu WebP
            $optimizedImage = Image::make($file)
                ->fit(400, 400, function ($constraint) {
                    $constraint->upsize();
                })
                ->encode('webp', 80);

            // Uložení optimalizovaného souboru do objektového úložiště R2
            Storage::disk('r2')->put(
                $filename,
                $optimizedImage->stream(),
                'public'
            );

            // Uložení cesty k avataru do databáze uživatele
            $user->profile_image = $filename;
            $user->save();
        }

        // Vyhodnocení podmínek pro aktivní stav profilu po aktualizaci údajů
        $profileComplete = $user->first_name && $user->last_name && $user->email &&
                        $user->bio && $user->location && $user->phone;

        $hasSpecializations = $user->specs()->count() > 0;
        $hasAvatar = ! empty($user->profile_image);

        $wasActive = $user->active_worker_till && $user->active_worker_till->isFuture();
        $isStillEligible = $profileComplete && $hasSpecializations && $hasAvatar;

        $extraMessage = null;

        // Deaktivace režimu hledání práce při ztrátě způsobilosti profilu
        if ($wasActive && ! $isStillEligible) {
            $user->active_worker_till = null;
            $user->save();
            $extraMessage = 'Profil byl aktualizován, ale mód "Hledám práci" byl vypnut kvůli neúplným údajům.';
        }

        return response()->json([
            'message' => $extraMessage ?? 'Profil byl úspěšně aktualizován.',
            'user' => $user->fresh()->load('specs')->append('profile_image_url'),
            'deactivated' => ($wasActive && ! $isStillEligible),
        ]);
    }

    public function profileCheck($id)
    {
        $user = User::with('specs')->findOrFail($id);

        $profileComplete = $user->first_name &&
            $user->last_name &&
            $user->email &&
            $user->bio &&
            $user->location &&
            $user->phone;

        $hasSpecializations = $user->specs->count() > 0;

        return response()->json([
            'profileComplete' => $profileComplete,
            'hasSpecializations' => $hasSpecializations,
            'hasAvatar' => ! empty($user->profile_image),
        ]);
    }

    public function lookingForJobToggle(Request $request, $id)
    {
        $user = User::with('specs')->findOrFail($id);

        // Pokud uživatel chce zapnout (nyní je vypnuto nebo prošlé)
        if (! $user->active_worker_till || $user->active_worker_till->isPast()) {
            $profileComplete = $user->first_name && $user->last_name && $user->email &&
                $user->bio && $user->location && $user->phone;
            $hasSpecializations = $user->specs->count() > 0;
            $hasAvatar = ! empty($user->profile_image);

            if (! $profileComplete || ! $hasSpecializations || ! $hasAvatar) {
                return response()->json([
                    'error' => 'incomplete_profile',
                    'profileComplete' => (bool) $profileComplete,
                    'hasSpecializations' => (bool) $hasSpecializations,
                    'hasAvatar' => (bool) $hasAvatar,
                ], 422);
            }

            $user->active_worker_till = now()->addDays(14);
        } else {
            // Vypnutí funguje vždy
            $user->active_worker_till = null;
        }

        $user->save();

        return response()->json([
            'active_worker_till' => $user->active_worker_till,
            'is_active' => $user->active_worker_till !== null,
        ]);
    }

    // Prodloužení módu hledám práci přes podepsaný odkaz
    public function extendActiveWorker(Request $request)
    {
        $user = User::findOrFail($request->query('user'));

        // prodloužení
        $user->active_worker_till = now()->addDays(14);
        $user->active_worker_reminder_sent_at = null;
        $user->save();

        // redirect do FE
        return redirect(config('app.frontend_url').'/app/?extended=1');
    }

    public function show($id)
    {
        // Zkusíme najít podle slugu, pokud selže, zkusíme ID (pro jistotu)
        $user = User::withTrashed()
            ->with(['specs', 'riders'])
            ->where('id', $id)
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Uživatel nenalezen'], 404);
        }

        $visitor = auth('sanctum')->user();
        $isPrivileged = $visitor && ($visitor->isAdmin() || $visitor->isModerator());

        // Pokud je smazaný a nejsem privilegovaný, skryju citlivá data, ale pošlu zbytek
        if ($user->trashed() && ! $isPrivileged) {
            $user->makeHidden(['bio', 'location', 'phone', 'email', 'specs', 'riders', 'created_at', 'last_login']);

            return response()->json([
                'user' => $user->append('profile_image_url'),
                'rider_images' => [], // Smazaný uživatel pro běžné lidi nemá fotky techniky
                'is_trashed_view' => true,
            ]);
        }

        $user->is_favourite = \DB::table('favourites_users')
            ->where('user_id', auth('sanctum')->id())
            ->where('favourite_user_id', $id)
            ->exists();

        $baseUrl = config('filesystems.disks.r2.url');

        // Důležité: Vrátit rider_images ve formátu, který očekává frontend
        $riderImages = $user->riders->map(function ($rider) use ($baseUrl) {
            return $baseUrl ? rtrim($baseUrl, '/').'/'.$rider->image_url : $rider->image_url;
        });

        return response()->json([
            'user' => $user->append(['profile_image_url']),
            'rider_images' => $riderImages, // Pole stringů (URL)
        ]);
    }

    public function updateRider(Request $request)
    {
        $user = $request->user();

        // Získáme seznam aktuálních obrázků/souborů v DB
        $currentRiders = UserRider::where('user_id', $user->id)->get();

        // Seznam URL, které mají zůstat
        $existingImages = $request->input('existing_images', []);

        // Smazání odstraněných souborů
        foreach ($currentRiders as $rider) {
            $fullUrl = config('filesystems.disks.r2.url').'/'.$rider->image_url;

            if (! in_array($fullUrl, $existingImages)) {
                Storage::disk('r2')->delete($rider->image_url);
                $rider->delete();
            }
        }

        // Zpracování nově nahraných souborů podle typu přípony
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {

                $extension = strtolower($file->getClientOriginalExtension());
                $uniqueName = uniqid().'_'.time();
                $folder = "riders/{$user->id}/";

                if ($extension === 'pdf') {
                    $filename = $folder.$uniqueName.'.pdf';

                    // Uložení PDF dokumentu bez obrazové optimalizace
                    Storage::disk('r2')->putFileAs($folder, $file, $uniqueName.'.pdf', 'public');

                } else {
                    $filename = $folder.$uniqueName.'.webp';

                    // Konverze obrázku do WebP pro efektivnější uložení a přenos
                    $img = Image::make($file)
                        ->resize(1600, null, function ($constraint) {
                            $constraint->aspectRatio();
                            $constraint->upsize();
                        })
                        ->encode('webp', 80);

                    // Uložení streamu na R2
                    Storage::disk('r2')->put($filename, $img->stream(), 'public');
                }

                // Uložení do DB (společné pro PDF i Obrázek)
                UserRider::create([
                    'user_id' => $user->id,
                    'image_url' => $filename,
                ]);
            }
        }

        return response()->json(['message' => 'Rider updated successfully']);
    }

    public function index(Request $request)
    {
        $currentUserId = auth('sanctum')->id(); // Získá ID přihlášeného uživatele

        $query = User::with(['specs'])
            ->where('active_worker_till', '>', now())
            ->where('id', '!=', $currentUserId);

        // Přidáme informaci o oblíbených přímo do hlavního dotazu (Join/Subquery)
        if ($currentUserId) {
            $query->leftJoin('favourites_users', function ($join) use ($currentUserId) {
                $join->on('users.id', '=', 'favourites_users.favourite_user_id')
                    ->where('favourites_users.user_id', '=', $currentUserId);
            })->select('users.*', DB::raw('IF(favourites_users.user_id IS NOT NULL, 1, 0) as is_favourite'));
        }

        // FILTR PODKATEGORIÍ (např. sound_technician)
        if ($request->filled('subcategory')) {
            $query->whereHas('specs', function ($q) use ($request) {
                $q->where('slug', $request->subcategory);
            });
        }

        // FILTR HODNOCENÍ (Musí se jmenovat stejně jako v Reactu v params)
        if ($request->boolean('minRating')) {
            $query->where('review_value', '>=', 4);
        }

        // VYHLEDÁVÁNÍ (Jméno + Bio)
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$searchTerm}%"])
                    ->orWhere('bio', 'LIKE', "%{$searchTerm}%");
            });
        }

        // LOKALITA
        if ($request->filled('location')) {
            $query->where('location', $request->location);
        }

        $workers = $query->orderBy('review_value', 'desc')->paginate(20);

        // Transformace dat pro frontend
        $workers->getCollection()->transform(function ($user) {
            $user->append('profile_image_url');
            $user->formatted_specs = $user->specs->pluck('name')->implode(' | ');

            // Pokud currentUserId neexistuje, nastavíme false defaultně
            if (! isset($user->is_favourite)) {
                $user->is_favourite = false;
            } else {
                // SQL vrací 1/0 jako string nebo int, převedeme na boolean pro JS
                $user->is_favourite = (bool) $user->is_favourite;
            }

            return $user;
        });

        return response()->json($workers);
    }
}
