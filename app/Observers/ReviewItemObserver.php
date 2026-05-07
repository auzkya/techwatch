<?php

// Hlídá automatický přepočet hodnocení u zařízení na základě recenzí

namespace App\Observers;

use App\Models\Item;
use App\Models\ReviewItem;
use App\Events\ReviewUpdatedEvent;

class ReviewItemObserver
{
    private function updateRating($review)
    {
        $itemId = $review->item_id;
        $average = ReviewItem::where('item_id', $itemId)->avg('review_value');

        Item::where('id', $itemId)->update([
            'review_value' => $average ? round($average, 1) : null,
        ]);
    }

    public function created(ReviewItem $review)
    {
        $this->updateRating($review);
        broadcast(new ReviewUpdatedEvent($review))->toOthers();
    }

    public function updated(ReviewItem $review)
    {
        $this->updateRating($review);
        broadcast(new ReviewUpdatedEvent($review))->toOthers();
    }

    public function deleted(ReviewItem $review)
    {
        $this->updateRating($review);
        broadcast(new ReviewUpdatedEvent($review))->toOthers();
    }
}
