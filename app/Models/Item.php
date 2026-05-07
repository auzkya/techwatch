<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    // aby nahlášené položky při smazání adminem úplně nezmizely z historie
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'title', 'description', 'price', 'category',
        'location', 'purpose', 'quantity', 'images', 'active_item', 'review_value',
    ];

    // Přidáno reviews_count pro frontend
    protected $appends = ['image_urls', 'reviews_count'];

    protected $casts = [
        'price' => 'float',
        'images' => 'array',
        'active_item' => 'integer',
        'review_value' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Vztah k recenzím - důležité pro Observer i pro výpočty (bez deleted_at uživatele)
    public function reviews()
    {
        return $this->hasMany(ReviewItem::class, 'item_id')
            ->whereHas('reviewer', function ($query) {
                $query->whereNull('deleted_at');
            });
    }
    public function getReviewValueAttribute()
    {
        $avg = $this->reviews()->avg('review_value') ?: 0;
        return (float) number_format((float) $avg, 1, '.', '');
    }

    // Accessor pro počet recenzí
    public function getReviewsCountAttribute()
    {
        return $this->reviews()->count();
    }

    public function getImageUrlsAttribute()
    {
        $paths = $this->images ?? [];

        return array_map(function ($path) {
            if (str_starts_with($path, 'http')) {
                return $path;
            }

            return Storage::disk('r2')->url($path);
        }, (array) $paths);
    }

    public function favouritedBy()
    {
        return $this->belongsToMany(User::class, 'favourites_items', 'item_id', 'user_id');
    }
}
