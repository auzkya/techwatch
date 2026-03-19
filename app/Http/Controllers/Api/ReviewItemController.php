<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationSent;
use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Notification;
use App\Models\ReviewItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewItemController extends Controller
{
    /**
     * Získání všech recenzí pro konkrétní techniku/inzerát
     */
    public function index($itemId)
    {
        $currentUserId = Auth::id();

        $reviews = ReviewItem::where('item_id', $itemId)
            ->with(['reviewer:id,first_name,last_name,profile_image', 'reviewer.specs'])
            // ✅ Moje recenze bude první, zbytek podle data
            ->orderByRaw('CASE WHEN reviewer_id = ? THEN 0 ELSE 1 END', [$currentUserId])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    /**
     * Uložení nové recenze
     */
    public function store(Request $request, $itemId)
    {
        // Validace dat z frontendu (React posílá rating a text)
        $validated = $request->validate([
            'rating' => 'required|numeric|min:0.5|max:5',
            'text' => 'nullable|string|max:1000',
            'pros' => 'nullable|array',
            'cons' => 'nullable|array',
        ]);

        $review = ReviewItem::create([
            'reviewer_id' => Auth::id(),
            'item_id' => $itemId,
            'review_value' => $validated['rating'], // Mapujeme frontend 'rating' na DB 'review_value'
            'review' => $validated['text'],         // Mapujeme frontend 'text' na DB 'review'
            'pros' => $validated['pros'] ?? [],
            'cons' => $validated['cons'] ?? [],
        ]);

        // Vytvoření notifikace pro majitele nabídky
        $item = Item::find($itemId); // Předpokládám model pro nabídku
        $reviewer = Auth::user();
        // Notifikaci pošleme majiteli nabídky (item->user_id)
        $notification = Notification::create([
            'user_id' => $item->user_id,
            'sender_id' => $reviewer->id,
            'type' => 'review_item', // Specifický typ
            'title' => 'Nová recenze',
            'description' => "<span className='strong'>{$reviewer->first_name} {$reviewer->last_name}</span> ohodnotil <span className='strong'>Vaši nabídku</span>.",
            'target_id' => $itemId, // ID nabídky
            'target_sub_id' => $review->id, // ID konkrétní recenze pro scroll
            'is_read' => false,
        ]);

        broadcast(new NotificationSent($notification->load('sender')));

        return response()->json($review->load('reviewer'), 201);
    }

    /**
     * Aktualizace existující recenze
     */
    public function update(Request $request, $id)
    {
        // Kontrola, zda recenze existuje a patří přihlášenému uživateli
        $review = ReviewItem::where('id', $id)
            ->where('reviewer_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'rating' => 'required|numeric|min:0.5|max:5',
            'text' => 'nullable|string|max:1000',
            'pros' => 'nullable|array',
            'cons' => 'nullable|array',
        ]);

        $review->update([
            'review_value' => $validated['rating'],
            'review' => $validated['text'],
            'pros' => $validated['pros'] ?? [],
            'cons' => $validated['cons'] ?? [],
        ]);

        return response()->json($review->load('reviewer'));
    }

    /**
     * Smazání recenze
     */
    public function destroy($id)
    {
        $review = ReviewItem::where('id', $id)
            ->where('reviewer_id', Auth::id())
            ->firstOrFail();

        $review->delete();

        return response()->json(['message' => 'Recenze byla úspěšně smazána.']);
    }
}
