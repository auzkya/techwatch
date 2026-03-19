<?php

namespace App\Http\Controllers\Api;

use App\Events\NotificationSent;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\ReviewUser;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ReviewUserController extends Controller
{
    public function index($userId)
    {
        $currentUserId = Auth::id();
        $reviews = ReviewUser::where('reviewed_user_id', $userId)
            ->with(['reviewer:id,first_name,last_name,profile_image', 'reviewer.specs'])
            ->orderByRaw('CASE WHEN reviewer_id = ? THEN 0 ELSE 1 END', [$currentUserId])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    public function store(Request $request, $reviewedUserId)
    {
        if (Auth::id() == $reviewedUserId) {
            return response()->json(['message' => 'Nemůžete hodnotit sami sebe.'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|numeric|min:0.5|max:5',
            'text' => 'nullable|string|max:700',
            'pros' => 'nullable|array',
            'cons' => 'nullable|array',
        ]);

        $review = ReviewUser::create([
            'reviewer_id' => Auth::id(),
            'reviewed_user_id' => $reviewedUserId,
            'review_value' => $validated['rating'],
            'review' => $validated['text'],
            'pros' => $validated['pros'],
            'cons' => $validated['cons'],
        ]);

        // Vytvoření notifikace pro hodnoceného uživatele po uložení recenze
        $reviewedUser = User::find($reviewedUserId);
        $reviewer = Auth::user();
        $slug = Str::slug($reviewedUser->first_name.'-'.$reviewedUser->last_name);
        $notification = Notification::create([
            'user_id' => $reviewedUserId,
            'sender_id' => $reviewer->id,
            'type' => 'review_user',
            'title' => 'Nová recenze',
            'description' => "<span className='strong'>{$reviewer->first_name} {$reviewer->last_name}</span> ohodnotil <span className='strong'>Váš profil</span>.",
            'target_id' => $reviewedUserId,
            'target_sub_id' => $review->id,
            'target_slug' => $slug,
            'is_read' => false,
        ]);

        // Publikování realtime události pro doručení notifikace
        broadcast(new NotificationSent($notification));

        return response()->json($review, 201);
    }

    public function update(Request $request, $id)
    {
        $review = ReviewUser::where('id', $id)->where('reviewer_id', Auth::id())->firstOrFail();

        $validated = $request->validate([
            'rating' => 'required|numeric|min:0.5|max:5',
            'text' => 'nullable|string|max:700',
            'pros' => 'nullable|array',
            'cons' => 'nullable|array',
        ]);

        $review->update([
            'review_value' => $validated['rating'],
            'review' => $validated['text'],
            'pros' => $validated['pros'],
            'cons' => $validated['cons'],
        ]);

        return response()->json($review);
    }

    public function destroy($id)
    {
        $review = ReviewUser::where('id', $id)->where('reviewer_id', Auth::id())->firstOrFail();
        $review->delete();

        return response()->json(['message' => 'Recenze smazána.']);
    }
}
