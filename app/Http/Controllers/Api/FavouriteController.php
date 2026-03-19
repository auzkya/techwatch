<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationSent;
use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavouriteController extends Controller
{
    public function toggleUser($id)
    {
        $user = auth()->user();
        $targetUser = User::findOrFail($id);
        // Ruční kontrola existence záznamu v M:N tabulce pro jednoznačné mazání/vložení
        $exists = DB::table('favourites_users')
            ->where('user_id', $user->id)
            ->where('favourite_user_id', $id)
            ->exists();

        if ($exists) {
            DB::table('favourites_users')
                ->where('user_id', $user->id)
                ->where('favourite_user_id', $id)
                ->delete();

            return response()->json(['status' => 'removed', 'message' => 'Odstraněno z oblíbených']);
        }

        DB::table('favourites_users')->insert([
            'user_id' => $user->id,
            'favourite_user_id' => $id,
            'created_at' => now(),
        ]);

        return response()->json(['status' => 'added', 'message' => 'Přidáno do oblíbených']);
    }

    public function toggleItem($id)
    {
        $user = auth()->user();
        $item = Item::findOrFail($id);
        $exists = DB::table('favourites_items')
            ->where('user_id', $user->id)
            ->where('item_id', $id)
            ->exists();

        if ($exists) {
            DB::table('favourites_items')
                ->where('user_id', $user->id)
                ->where('item_id', $id)
                ->delete();

            return response()->json(['status' => 'removed']);
        }

        DB::table('favourites_items')->insert([
            'user_id' => $user->id,
            'item_id' => $id,
            'created_at' => now(),
        ]);

        return response()->json(['status' => 'added']);
    }

    public function index(Request $request)
    {
        $currentUser = auth('sanctum')->user();

        if (! $currentUser) {
            return response()->json(['message' => 'Uživatel nenalezen'], 404);
        }

        $searchTerm = $request->query('search');

        // Načtení oblíbených pracovníků aktuálního uživatele
        $workersQuery = User::with(['specs'])
            ->whereHas('favouritedBy', function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id);
            })
            ->where('active_worker_till', '>', now());

        if ($request->filled('search')) {
            $workersQuery->where(function ($q) use ($searchTerm) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$searchTerm}%"])
                    ->orWhere('bio', 'LIKE', "%{$searchTerm}%");
            });
        }

        $workers = $workersQuery->get()->map(function ($user) {
            $user->append('profile_image_url');
            $user->formatted_specs = $user->specs->pluck('name')->implode(' | ');
            $user->is_favourite = true;

            return $user;
        });

        // Načtení oblíbených položek techniky aktuálního uživatele
        $techQuery = Item::whereHas('favouritedBy', function ($q) use ($currentUser) {
            $q->where('user_id', $currentUser->id);
        })
            ->where('active_item', true);

        if ($request->filled('search')) {
            $techQuery->where('title', 'LIKE', "%{$searchTerm}%");
        }

        $tech = $techQuery->get()->map(function ($item) {
            $item->is_favourite = true;

            // Sjednocení hlavního obrázku položky pro výstup API
            if ($item->images) {
                $images = is_array($item->images) ? $item->images : json_decode($item->images, true);
                $item->main_image_url = ! empty($images) ? \Storage::disk('r2')->url($images[0]) : null;
            }

            $item->category_name = $item->category;
            // Sjednocení názvu položky na atribut `name` pro frontend
            $item->name = $item->title;

            return $item;
        });

        return response()->json([
            'workers' => $workers,
            'tech' => $tech,
        ]);
    }
}
