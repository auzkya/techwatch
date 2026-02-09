<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewItem extends Model
{
    use HasFactory;

    protected $table = 'reviews_items';

    protected $fillable = ['reviewer_id', 'item_id', 'review_value', 'review', 'pros', 'cons'];

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
