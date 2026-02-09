<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewUser extends Model
{
    use HasFactory;

    protected $table = 'reviews_users';

    protected $fillable = ['reviewer_id', 'reviewed_user_id', 'review_value', 'review', 'pros', 'cons'];

    protected $casts = [
        'pros' => 'array',
        'cons' => 'array',
        'review_value' => 'float',
    ];

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
