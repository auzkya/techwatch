<?php

// Hlídá automatický přepočet hodnocení u pracovníků na základě recenzí

namespace App\Observers;

use App\Models\ReviewUser;
use App\Models\User;

class ReviewUserObserver
{
    private function updateRating($review)
    {
        $userId = $review->reviewed_user_id;
        $average = ReviewUser::where('reviewed_user_id', $userId)->avg('review_value');

        User::where('id', $userId)->update([
            'review_value' => $average ? round($average, 1) : null,
        ]);
    }

    public function created(ReviewUser $review)
    {
        $this->updateRating($review);
    }

    public function updated(ReviewUser $review)
    {
        $this->updateRating($review);
    }

    public function deleted(ReviewUser $review)
    {
        $this->updateRating($review);
    }
}
