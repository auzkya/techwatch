<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Item;
use App\Models\User;
use App\Models\Notification;
use App\Events\NotificationSent;

class FavouriteController extends Controller
{
    public function toggleUser($id)
    {
        $user = auth()->user();
        $targetUser = User::findOrFail($id); // Najdeme uživatele, kterého si někdo přidává
        // toggle() v Laravelu pro M:N vztahy funguje skvěle,
        // ale my zde použijeme manuální kontrolu kvůli primárnímu klíči
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
            'created_at' => now()
        ]);

        // ODESLÁNÍ NOTIFIKACE (jen když přidává do oblíbených)
        // Nechceme notifikovat sami sebe
        /*if ($user->id !== $targetUser->id) {
            $notification = Notification::create([
                'user_id' => $targetUser->id,
                'type' => 'favourite_user',
                'title' => 'Nový fanoušek!',
                'description' => "Uživatel {$user->first_name} {$user->last_name} si vás přidal do oblíbených.",
                'is_read' => false,
                'data' => [
                    'sender_id' => $user->id,
                    'sender_name' => "{$user->first_name} {$user->last_name}",
                    'sender_avatar' => $user->profile_image_url
                ]
            ]);

            broadcast(new NotificationSent($notification))->toOthers();
        }*/

        return response()->json(['status' => 'added', 'message' => 'Přidáno do oblíbených']);
    }

    public function toggleItem($id)
    {
        $user = auth()->user();
        $item = Item::findOrFail($id); // Najdeme věc, kterou si někdo přidává
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
            'created_at' => now()
        ]);

        // ODESLÁNÍ NOTIFIKACE majiteli položky
        /*if ($user->id !== $item->user_id) {
            $notification = Notification::create([
                'user_id' => $item->user_id, // Majitel položky
                'type' => 'favourite_item',
                'title' => 'Líbí se mi!',
                'description' => "Uživatel {$user->first_name} si přidal vaši nabídku {$item->title} do oblíbených.",
                'is_read' => false,
                'data' => [
                    'item_id' => $item->id,
                    'item_title' => $item->title,
                    'sender_name' => $user->first_name
                ]
            ]);

            broadcast(new NotificationSent($notification))->toOthers();
        }*/

        return response()->json(['status' => 'added']);
    }

    public function index(Request $request)
    {
        $currentUser = auth('sanctum')->user();

        if (!$currentUser) {
            return response()->json(['message' => 'Uživatel nenalezen'], 404);
        }

        $searchTerm = $request->query('search');

        // --- PRACOVNÍCI ---
        $workersQuery = User::with(['specs'])
            ->whereHas('favouritedBy', function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id);
            });

        if ($request->filled('search')) {
            $workersQuery->where(function ($q) use ($searchTerm) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$searchTerm}%"])
                    ->orWhere('bio', 'LIKE', "%{$searchTerm}%");
            });
        }

        $workers = $workersQuery->get()->map(function ($user) use ($currentUser) {
            $user->append('profile_image_url');
            $user->formatted_specs = $user->specs->pluck('name')->implode(' | ');
            $user->is_favourite = true; // Jsme v seznamu oblíbených
            return $user;
        });

        // --- TECHNIKA ---
        $techQuery = Item::whereHas('favouritedBy', function ($q) use ($currentUser) {
            $q->where('user_id', $currentUser->id);
        });

        if ($request->filled('search')) {
            $techQuery->where('title', 'LIKE', "%{$searchTerm}%"); // V TechControlleru máš 'title', ne 'name'
        }

        $tech = $techQuery->get()->map(function ($item) {
            $item->is_favourite = true;

            // Použijeme tvou logiku pro obrázky z TechControlleru
            if ($item->images) {
                $images = is_array($item->images) ? $item->images : json_decode($item->images, true);
                $item->main_image_url = !empty($images) ? \Storage::disk('r2')->url($images[0]) : null;
            }

            // V TechControlleru máš sloupec 'category', ne vztah
            $item->category_name = $item->category;
            // Pro frontend Item.js sjednoť jméno na 'name'
            $item->name = $item->title;

            return $item;
        });

        return response()->json([
            'workers' => $workers,
            'tech' => $tech
        ]);
    }
}
