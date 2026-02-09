<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'bio',
        'location',
        'phone',
        'phone_visible',
        'profile_image',
        'is_active',
        'google_id',
        'facebook_id',
        'active_worker_till',
        'review_value'
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'phone_visible' => 'boolean',
        'is_active' => 'boolean',
        'active_worker_till' => 'datetime',
        'review_value' => 'float',
    ];

    protected $appends = ['profile_image_url', 'reviews_count'];

    // Vztahy
    public function specs()
    {
        return $this->belongsToMany(Spec::class);
    }
    public function items()
    {
        return $this->hasMany(Item::class);
    }
    public function riders()
    {
        return $this->hasMany(UserRider::class, 'user_id');
    }

    // Vztah k recenzím, které uživatel DOSTAL
    public function reviewsReceived()
    {
        return $this->hasMany(ReviewUser::class, 'reviewed_user_id');
    }

    // Accessor pro počet recenzí
    public function getReviewsCountAttribute()
    {
        return $this->reviewsReceived()->count();
    }

    public function getProfileImageUrlAttribute()
    {
        if (!$this->profile_image)
            return null;
        if (filter_var($this->profile_image, FILTER_VALIDATE_URL))
            return $this->profile_image;
        return Storage::disk('r2')->url($this->profile_image);
    }

    public function favouritedBy()
    {
        return $this->belongsToMany(User::class, 'favourites_users', 'favourite_user_id', 'user_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isModerator(): bool
    {
        return $this->role === 'moderator' || $this->role === 'admin';
    }
}
