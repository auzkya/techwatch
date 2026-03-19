<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Intervention\Image\Facades\Image;

class TechController extends Controller
{
    // Pomocná metoda pro transformaci cest na URL (přidej ji na konec třídy)
    private function transformImages($item)
    {
        if (! $item->images) {
            return [];
        }

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

        // Definice pravidel
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:700',
            'price' => 'nullable|numeric',
            'category' => 'required|string',
            'location' => 'required|string',
            'purpose' => 'required|string',
            'quantity' => 'bail|required|numeric|min:1|max:1000000', // Přidán rozumný limit
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,avif|max:8192',
        ];

        // Definice vlastních českých hlášek
        $messages = [
            'title.required' => 'Název je povinný.',
            'description.required' => 'Popis je povinný.',
            'quantity.required' => 'Množství je povinné.',
            'quantity.numeric' => 'Zadejte prosím platné číslo.',
            'quantity.min' => 'Množství musí být alespoň 1.',
            'quantity.max' => 'Zadané množství je příliš vysoké.',
            'images.required' => 'Musíte nahrát alespoň jeden obrázek.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $imgFile) {
                // Sjednocená cesta: items/id_timestamp_webp.jpg
                $filename = 'items/'.$user_id.'_'.time().'_'.$index.'.webp';

                // Optimalizace pomocí Intervention Image
                $optimizedImage = Image::make($imgFile)
                    ->resize(1200, null, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    })
                    ->encode('webp', 80);

                Storage::disk('r2')->put($filename, $optimizedImage->stream(), 'public');
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
            'images' => $imagePaths,
        ]);

        return response()->json([
            'message' => 'Technika byla úspěšně přidána.',
            'item' => $item,
        ]);
    }

    public function update(Request $request, $id)
    {
        // Načtení položky omezené na vlastníka pro autorizaci úpravy
        $item = Item::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $item) {
            return response()->json(['message' => 'Přístup odepřen.'], 403);
        }

        // Validace požadavku s nepovinným polem obrázků pro částečnou aktualizaci
        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:700',
            'price' => 'nullable|numeric',
            'category' => 'required|string',
            'location' => 'required|string',
            'purpose' => 'required|string',
            'quantity' => 'bail|required|numeric|min:1|max:1000000',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp,avif|max:8192',
        ];

        $messages = [
            'title.required' => 'Název je povinný.',
            'description.required' => 'Popis je povinný.',
            'quantity.required' => 'Množství je povinné.',
            'quantity.numeric' => 'Zadejte prosím platné číslo.',
            'quantity.min' => 'Množství musí být alespoň 1.',
            'quantity.max' => 'Zadané množství je příliš vysoké.',
            'images.required' => 'Musíte nahrát alespoň jeden obrázek.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Normalizace již uložených obrázků před sloučením s novými soubory
        $existingRaw = $request->has('existing_images') ? json_decode($request->input('existing_images'), true) : [];
        $imagePaths = [];

        foreach ($existingRaw as $url) {
            if (str_contains($url, 'items/')) {
                $parts = explode('items/', $url);
                $imagePaths[] = 'items/'.end($parts);
            } elseif (is_string($url) && ! filter_var($url, FILTER_VALIDATE_URL)) {
                $imagePaths[] = $url;
            }
        }

        // Odstranění souborů z úložiště R2, které nejsou v aktualizovaném seznamu
        $oldImages = is_array($item->images) ? $item->images : json_decode($item->images, true) ?? [];
        foreach ($oldImages as $oldPath) {
            if (! in_array($oldPath, $imagePaths)) {
                Storage::disk('r2')->delete($oldPath);
            }
        }

        // Konverze nově nahraných obrázků do formátu WebP a jejich uložení
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $imgFile) {
                $filename = 'items/'.$user_id.'_'.time().'_upd_'.$index.'.webp';

                $optimizedImage = Image::make($imgFile)
                    ->resize(1200, null, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    })
                    ->encode('webp', 80);

                Storage::disk('r2')->put($filename, $optimizedImage->stream(), 'public');
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
        $user = auth('sanctum')->user();
        $isAdmin = $user && in_array($user->role, ['admin_moderator', 'super_admin']);

        $query = Item::with(['user.specs']);

        // Administrátorské rozhraní zahrnuje i soft-deleted záznamy
        if ($isAdmin) {
            $query->withTrashed();
        }

        $item = $query->find($id);

        if (! $item) {
            return response()->json(['message' => 'Nenalezeno'], 404);
        }

        // Skrytí soft-deleted položek před běžnými uživateli
        if ($item->trashed() && ! $isAdmin) {
            return response()->json(['message' => 'Nenalezeno'], 404);
        }

        if (! $item) {
            return response()->json(['message' => 'Nenalezeno'], 404);
        }

        // Při režimu editace ověření vlastnictví položky přihlášeným uživatelem
        if (request()->has('for_edit')) {
            if ((int) $item->user_id !== (int) auth()->id()) {
                return response()->json(['message' => 'Na editaci nemáte právo.'], 403);
            }
        }

        $item->is_favourite = \DB::table('favourites_items')
            ->where('user_id', auth('sanctum')->id())
            ->where('item_id', $id)
            ->exists();

        // Předání příznaku odstranění pro administrátorské UI
        $item->is_deleted = $item->trashed();

        // Transformace cest obrázků na výstupní formát pro detail položky
        $item->images = $this->transformImages($item);

        return response()->json([
            'item' => $item,
        ]);
    }

    public function index(Request $request)
    {
        $currentUserId = auth('sanctum')->id();
        $query = Item::query()->where('active_item', true);

        // Vyloučení vlastních nabídek z veřejného výpisu
        if ($currentUserId) {
            $query->where('user_id', '!=', $currentUserId);
        }

        // Filtrace podle lokality
        if ($request->filled('location')) {
            $query->where('location', $request->location);
        }

        // Filtrace podle kategorie
        if ($request->filled('subcategory')) {
            $query->where('category', $request->subcategory);
        }

        // Filtrace podle účelu nabídky
        if ($request->filled('purpose') && $request->purpose !== 'all') {
            $query->where('purpose', $request->purpose);
        }

        // Filtrace podle minimálního hodnocení
        if ($request->on_agreement == 'true' || $request->minRating == 'true') {
            $query->where('review_value', '>=', 4);
        }

        // Filtrace podle minimálního množství
        if ($request->filled('quantity')) {
            $query->where('quantity', '>=', (int) $request->quantity);
        }

        // Filtrace nabídek bez pevně stanovené ceny
        if ($request->on_agreement == 'true') {
            $query->where(function ($q) {
                $q->where('price', 0)->orWhereNull('price');
            });
        }

        // Fulltextové vyhledávání v názvu a popisu nabídky
        if ($request->filled('search')) {
            $searchTerm = '%'.$request->search.'%';
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
            $query->where('title', 'LIKE', '%'.$request->search.'%');
        }

        if ($isOwner) {
            // Vlastník: filtruje podle stavu (Aktivní/Neaktivní)
            if ($request->status === 'active') {
                $query->where('active_item', true);
            }
            if ($request->status === 'inactive') {
                $query->where('active_item', false);
            }
        } else {
            // Cizí: vidí pouze aktivní a může filtrovat lokalitu/účel
            $query->where('active_item', true);
            if ($request->filled('location')) {
                $query->where('location', $request->location);
            }
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
            'owner_name' => $owner ? $owner->first_name.' '.$owner->last_name : 'Uživatel',
            'is_owner' => $isOwner,
        ]);
    }

    // Změna stavu aktivní/neaktivní (Skrýt/Zobrazit)
    public function updateStatus(Request $request, $id)
    {
        // Najdeme item, který patří přihlášenému uživateli
        $item = Item::where('id', $id)->first();

        if (! $item || (int) $item->user_id !== (int) Auth::id()) {
            return response()->json(['message' => 'Přístup odepřen.'], 403);
        }

        // Validujeme, že přišla nula nebo jednička
        $request->validate([
            'active_item' => 'required|in:0,1',
        ]);

        $item->update([
            'active_item' => (int) $request->active_item,
        ]);

        return response()->json([
            'message' => $item->active_item == 1 ? 'Inzerát byl aktivován.' : 'Inzerát byl skryt.',
            'active_item' => $item->active_item,
        ]);
    }

    // Trvalé smazání inzerátu včetně obrázků na R2 
    public function destroy($id)
    {
        $item = Item::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $item) {
            return response()->json(['message' => 'Přístup odepřen.'], 403);
        }

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
