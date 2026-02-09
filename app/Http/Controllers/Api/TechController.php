<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Item;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TechController extends Controller
{

    // Pomocná metoda pro transformaci cest na URL (přidej ji na konec třídy)
    private function transformImages($item)
    {
        if (!$item->images)
            return [];

        // Pokud máš v modelu Item.php protected $casts = ['images' => 'array']
        // tak už je to pole, jinak bys musel udělat json_decode
        $images = is_array($item->images) ? $item->images : json_decode($item->images, true);

        return array_map(function ($path) {
            // Generuje plnou URL k R2 (nebo storage)
            return Storage::disk('r2')->url($path);
        }, $images);
    }

    public function store(Request $request)
    {
        $user_id = Auth::id();

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:700',
            'price' => 'nullable|numeric',
            'category' => 'required|string',
            'location' => 'required|string',
            'purpose' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $img) {
                // Sjednocená cesta: items/id_timestamp_index.jpg
                $filename = 'items/' . $user_id . '_' . time() . '_' . $index . '.jpg';

                Storage::disk('r2')->put(
                    $filename,
                    file_get_contents($img),
                    'public'
                );

                $imagePaths[] = $filename;
            }
        }

        $item = Item::create([
            'user_id' => $user_id,
            'title' => strip_tags($request->title),
            'description' => strip_tags($request->description),
            'price' => $request->price,
            'category' => $request->category,
            'location' => $request->location,
            'purpose' => $request->purpose,
            'quantity' => $request->quantity,
            'images' => $imagePaths
        ]);

        return response()->json([
            'message' => 'Technika byla úspěšně přidána.',
            'item' => $item
        ]);
    }

    public function update(Request $request, $id)
    {
        $item = Item::findOrFail($id);
        $user_id = Auth::id();

        // Validace: images není required, protože uživatel může chtít nechat původní
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:700',
            'price' => 'nullable|numeric',
            'category' => 'required|string',
            'location' => 'required|string',
            'purpose' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        // 1. Zpracování existujících obrázků
        // Musíme z nich odstranit doménu, pokud tam je, abychom ukládali jen cesty
        $existingRaw = $request->has('existing_images') ? json_decode($request->input('existing_images'), true) : [];
        $imagePaths = [];

        foreach ($existingRaw as $url) {
            // 1. Pokud je to URL, vytáhneme jen to, co začíná "items/"
            if (str_contains($url, 'items/')) {
                $parts = explode('items/', $url);
                $imagePaths[] = 'items/' . end($parts);
            }
            // 2. Pokud je to už jen čistá cesta, přidáme ji přímo
            elseif (is_string($url) && !filter_var($url, FILTER_VALIDATE_URL)) {
                $imagePaths[] = $url;
            }
        }

        // 2. Přidání nových obrázků
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $img) {
                $filename = 'items/' . $user_id . '_' . time() . '_upd_' . $index . '.jpg';

                Storage::disk('r2')->put(
                    $filename,
                    file_get_contents($img),
                    'public'
                );

                $imagePaths[] = $filename;
            }
        }

        $item->update([
            'title' => strip_tags($request->title),
            'description' => strip_tags($request->description),
            'category' => $request->category,
            'location' => $request->location,
            'purpose' => $request->purpose,
            'quantity' => $request->quantity,
            'price' => $request->price ?: null,
            'images' => $imagePaths,
        ]);

        return response()->json(['message' => 'Upraveno']);
    }

    public function show($id)
    {
        $item = Item::with(['user.specs'])->find($id);

        if (!$item) {
            return response()->json(['message' => 'Nenalezeno'], 404);
        }

        $item->is_favourite = \DB::table('favourites_items')
            ->where('user_id', auth('sanctum')->id())
            ->where('item_id', $id)
            ->exists();

        // Transformace obrázků pro detail
        $item->images = $this->transformImages($item);

        return response()->json([
            'item' => $item
        ]);
    }

    public function index(Request $request)
    {
        $currentUserId = auth('sanctum')->id();
        // Základní query
        $query = Item::query()->where('active_item', true);

        // Skrytí vlastních nabídek
        if ($currentUserId) {
            $query->where('user_id', '!=', $currentUserId);
        }

        // FILTR: Lokalita (oprava nefunkčnosti)
        if ($request->filled('location')) {
            $query->where('location', $request->location);
        }

        // FILTR: Kategorie (subcategory)
        if ($request->filled('subcategory')) {
            $query->where('category', $request->subcategory);
        }

        // FILTR: Účel (rental/sell)
        if ($request->filled('purpose') && $request->purpose !== 'all') {
            $query->where('purpose', $request->purpose);
        }

        // FILTR: Hodnocení (4+ hvězdy)
        if ($request->on_agreement == 'true' || $request->minRating == 'true') {
            // Pokud je minRating true, chceme jen 4.0 a víc
            $query->where('review_value', '>=', 4);
        }

        // FILTR: Minimální množství
        if ($request->filled('quantity')) {
            $query->where('quantity', '>=', (int) $request->quantity);
        }

        // FILTR: Cena (pouze "Dohodou")
        if ($request->on_agreement == 'true') {
            $query->where(function ($q) {
                $q->where('price', 0)->orWhereNull('price');
            });
        }

        // Vyhledávání
        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'LIKE', $searchTerm)
                    ->orWhere('description', 'LIKE', $searchTerm);
            });
        }

        // Řazení
        switch ($request->sort_by) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'review_value':
                $query->orderByRaw('review_value IS NULL, review_value DESC');
                break;
            default:
                $query->orderBy('created_at', 'desc');
        }

        $results = $query->paginate(20);

        // Transformace URL obrázků (jak jsme dělali minule)
        $results->getCollection()->transform(function ($item) use ($currentUserId) {

            $item->images = $this->transformImages($item);
            $item->is_favourite = $currentUserId ? DB::table('favourites_items')
                ->where('user_id', $currentUserId)
                ->where('item_id', $item->id)
                ->exists() : false;

            return $item;
        });

        return response()->json($results);
    }

    public function getUserListings(Request $request, $userId)
    {
        $currentUserId = auth('sanctum')->id();
        $isOwner = (int) $currentUserId === (int) $userId;

        $query = Item::where('user_id', $userId);

        // Filtry společné pro oba režimy
        if ($request->filled('subcategory')) {
            $query->where('category', $request->subcategory);
        }
        if ($request->filled('search')) {
            $query->where('title', 'LIKE', '%' . $request->search . '%');
        }

        if ($isOwner) {
            // Vlastník: filtruje podle stavu (Aktivní/Neaktivní)
            if ($request->status === 'active')
                $query->where('active_item', true);
            if ($request->status === 'inactive')
                $query->where('active_item', false);
        } else {
            // Cizí: vidí pouze aktivní a může filtrovat lokalitu/účel
            $query->where('active_item', true);
            if ($request->filled('location'))
                $query->where('location', $request->location);
            if ($request->filled('purpose') && $request->purpose !== 'all') {
                $query->where('purpose', $request->purpose);
            }
        }

        $items = $query->orderBy('created_at', 'desc')->get();
        $owner = User::find($userId);

        $items->transform(function ($item) {
            $item->images = $this->transformImages($item);
            return $item;
        });

        return response()->json([
            'items' => $items,
            'owner_name' => $owner ? $owner->first_name . ' ' . $owner->last_name : 'Uživatel',
            'is_owner' => $isOwner
        ]);
    }

    /* Změna stavu aktivní/neaktivní (Skrýt/Zobrazit) */
    public function updateStatus(Request $request, $id)
    {
        // Najdeme item, který patří přihlášenému uživateli
        $item = Item::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Validujeme, že přišla nula nebo jednička
        $request->validate([
            'active_item' => 'required|in:0,1'
        ]);

        $item->update([
            'active_item' => (int) $request->active_item
        ]);

        return response()->json([
            'message' => $item->active_item == 1 ? 'Inzerát byl aktivován.' : 'Inzerát byl skryt.',
            'active_item' => $item->active_item
        ]);
    }

    /* Trvalé smazání inzerátu včetně obrázků na R2 */
    public function destroy($id)
    {
        $item = Item::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Smazání obrázků z R2 před smazáním záznamu
        if ($item->images) {
            $images = is_array($item->images) ? $item->images : json_decode($item->images, true);
            foreach ($images as $path) {
                if (Storage::disk('r2')->exists($path)) {
                    Storage::disk('r2')->delete($path);
                }
            }
        }

        $item->delete();

        return response()->json(['message' => 'Inzerát byl úspěšně smazán.']);
    }
}
