<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReviewItem extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'reviews_items';

    protected $fillable = ['reviewer_id', 'item_id', 'review_value', 'review', 'pros', 'cons'];

    protected $casts = [
        'pros' => 'array',
        'cons' => 'array',
        'review_value' => 'float',
    ];

    protected static function booted()
    {
        static::addGlobalScope('hide_deleted_reviewers', function ($builder) {
            $builder->whereHas('reviewer', function ($query) {
                $query->whereNull('deleted_at');
            });
        });
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
